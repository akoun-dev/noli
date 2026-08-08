import { NextRequest, NextResponse } from 'next/server'
import { db, mapRow, mapRows } from '@/lib/db'
import { promises as fs } from 'fs'
import { join } from 'path'
import { requireAuth } from '@/lib/auth-guard'
import { logAudit } from '@/lib/audit'
import { DB_PATH, BACKUPS_DIR, resolveBackupPath } from '@/lib/backups'

async function upsertSetting(key: string, value: string, category: string, label: string, type: string) {
  const { data: existing } = await db
    .from("system_settings")
    .select("id")
    .eq("key", key)
    .maybeSingle()
  if (existing) {
    const { error } = await db.from("system_settings").update({ value }).eq("key", key)
    if (error) throw error
  } else {
    const { error } = await db.from("system_settings").insert({ key, value, category, label, type })
    if (error) throw error
  }
}

export async function GET() {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { data, error } = await db
      .from("backups")
      .select("id, filename, file_size, status, type, created_at")
      .order("created_at", { ascending: false })
    if (error) throw error

    // H-07 : ne jamais renvoyer le chemin serveur absolu.
    const backups = mapRows(data || []).map((b: Record<string, unknown>) => {
      const { path: _path, ...rest } = b
      return rest
    })

    // Planification enregistrée (pour réhydrater l'UI au chargement).
    let schedule: unknown = null
    const { data: scheduleSetting } = await db
      .from("system_settings")
      .select("value")
      .eq("key", "backup_schedule")
      .maybeSingle()
    if (scheduleSetting?.value) {
      try {
        schedule = JSON.parse(scheduleSetting.value)
      } catch {
        schedule = null
      }
    }

    return NextResponse.json({ backups, schedule })
  } catch (error) {
    console.error('Erreur lors de la récupération des sauvegardes:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sauvegardes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'schedule') {
      const body = await request.json()
      const { schedule, enabled } = body

      if (schedule === undefined || enabled === undefined) {
        return NextResponse.json(
          { error: 'Schedule et enabled sont requis' },
          { status: 400 }
        )
      }

      await Promise.all([
        upsertSetting('backup_schedule', JSON.stringify(schedule), 'general', 'Planification sauvegarde', 'json'),
        upsertSetting('backup_enabled', String(enabled), 'general', 'Sauvegarde automatique activée', 'boolean'),
      ])

      await logAudit({
        action: 'SETTINGS_CHANGE',
        entity: 'Backup',
        details: { schedule, enabled },
      })

      return NextResponse.json({ success: true })
    }

    // Action par défaut : créer une sauvegarde manuelle.
    // H-05 : opérations filesystem asynchrones (pas de blocage du thread).
    try {
      await fs.access(DB_PATH)
    } catch {
      return NextResponse.json(
        { error: 'Fichier de base de données introuvable' },
        { status: 404 }
      )
    }

    await fs.mkdir(BACKUPS_DIR, { recursive: true })

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
    const filename = `custom_${timestamp}.db`
    const destPath = join(BACKUPS_DIR, filename)

    try {
      await fs.copyFile(DB_PATH, destPath)
    } catch (copyError) {
      await logAudit({
        action: 'BACKUP_CREATE',
        entity: 'Backup',
        details: { filename, error: 'Échec de la copie du fichier' },
      })
      return NextResponse.json(
        { error: 'Échec de la copie du fichier de base de données' },
        { status: 500 }
      )
    }

    const fileStat = await fs.stat(destPath)
    const fileSize = fileStat.size

    // H-07 : on stocke le nom de fichier relatif, pas le chemin absolu.
    const { data: backupData, error } = await db
      .from("backups")
      .insert({
        filename,
        file_size: fileSize,
        status: 'COMPLETED',
        type: 'MANUAL',
        path: filename,
      })
      .select("id, filename, file_size, status, type, created_at")
      .single()
    if (error) throw error
    const backup = mapRow(backupData)

    await logAudit({
      action: 'BACKUP_CREATE',
      entity: 'Backup',
      entityId: backup!.id,
      details: { filename, fileSize, type: 'MANUAL' },
    })

    return NextResponse.json({ backup }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la sauvegarde:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la sauvegarde' },
      { status: 500 }
    )
  }
}
