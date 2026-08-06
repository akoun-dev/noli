import { NextRequest, NextResponse } from 'next/server'
import { db, mapRow, mapRows } from '@/lib/db'
import { existsSync, mkdirSync, copyFileSync, statSync } from 'fs'
import { join } from 'path'
import { requireAuth } from '@/lib/auth-guard'

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
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error

    return NextResponse.json({ backups: mapRows(data || []) })
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

      const { error: auditError } = await db.from("audit_logs").insert({
        action: 'SETTINGS_CHANGE',
        entity: 'Backup',
        details: JSON.stringify({ schedule, enabled }),
        user_name: 'SYSTEM',
      })
      if (auditError) throw auditError

      return NextResponse.json({ success: true })
    }

    // Action par défaut : créer une sauvegarde manuelle
    const dbPath = join(/* turbopackIgnore: true */ process.cwd(), 'db', 'custom.db')

    if (!existsSync(dbPath)) {
      return NextResponse.json(
        { error: 'Fichier de base de données introuvable' },
        { status: 404 }
      )
    }

    const backupsDir = join(/* turbopackIgnore: true */ process.cwd(), 'db', 'backups')
    if (!existsSync(backupsDir)) {
      mkdirSync(backupsDir, { recursive: true })
    }

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
    const filename = `custom_${timestamp}.db`
    const destPath = join(backupsDir, filename)

    try {
      copyFileSync(dbPath, destPath)
    } catch (copyError) {
      const { error: auditError } = await db.from("audit_logs").insert({
        action: 'BACKUP_CREATE',
        entity: 'Backup',
        details: JSON.stringify({ filename, error: 'Échec de la copie du fichier' }),
        user_name: 'SYSTEM',
      })
      if (auditError) throw auditError

      return NextResponse.json(
        { error: 'Échec de la copie du fichier de base de données' },
        { status: 500 }
      )
    }

    const fileStat = statSync(destPath)
    const fileSize = fileStat.size

    const { data: backupData, error } = await db
      .from("backups")
      .insert({
        filename,
        file_size: fileSize,
        status: 'COMPLETED',
        type: 'MANUAL',
        path: destPath,
      })
      .select()
      .single()
    if (error) throw error
    const backup = mapRow(backupData)

    const { error: auditError } = await db.from("audit_logs").insert({
      action: 'BACKUP_CREATE',
      entity: 'Backup',
      entity_id: backup!.id,
      details: JSON.stringify({ filename, fileSize, type: 'MANUAL' }),
      user_name: 'SYSTEM',
    })
    if (auditError) throw auditError

    return NextResponse.json({ backup }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la sauvegarde:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la sauvegarde' },
      { status: 500 }
    )
  }
}
