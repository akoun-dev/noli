import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { db, mapRow } from '@/lib/db'
import { existsSync, unlinkSync, copyFileSync } from 'fs'
import { join } from 'path'

async function findBackup(id: string) {
  const { data } = await db.from("backups").select("*").eq("id", id).maybeSingle()
  return mapRow<{ id: string; path: string | null; filename: string }>(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params

    const backup = await findBackup(id)

    if (!backup) {
      return NextResponse.json(
        { error: 'Sauvegarde non trouvée' },
        { status: 404 }
      )
    }

    if (backup.path && existsSync(backup.path)) {
      try {
        unlinkSync(backup.path)
      } catch {
        // Le fichier peut ne plus exister
      }
    }

    const { error } = await db.from("backups").delete().eq("id", id)
    if (error) throw error

    const { error: auditError } = await db.from("audit_logs").insert({
      action: 'BACKUP_DELETE',
      entity: 'Backup',
      entity_id: id,
      details: JSON.stringify({ filename: backup.filename }),
      user_name: 'SYSTEM',
    })
    if (auditError) throw auditError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression de la sauvegarde:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la sauvegarde' },
      { status: 500 }
    )
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params
    const requestUrl = _request.url
    const { searchParams } = new URL(requestUrl)
    const action = searchParams.get('action')

    if (action !== 'restore') {
      return NextResponse.json(
        { error: 'Action non reconnue' },
        { status: 400 }
      )
    }

    const backup = await findBackup(id)

    if (!backup) {
      return NextResponse.json(
        { error: 'Sauvegarde non trouvée' },
        { status: 404 }
      )
    }

    const backupPath = backup.path || join(/* turbopackIgnore: true */ process.cwd(), 'db', 'backups', backup.filename)
    const dbPath = join(/* turbopackIgnore: true */ process.cwd(), 'db', 'custom.db')

    if (!existsSync(backupPath)) {
      return NextResponse.json(
        { error: 'Fichier de sauvegarde introuvable' },
        { status: 404 }
      )
    }

    copyFileSync(backupPath, dbPath)

    const { error: auditError } = await db.from("audit_logs").insert({
      action: 'BACKUP_RESTORE',
      entity: 'Backup',
      entity_id: id,
      details: JSON.stringify({ filename: backup.filename, restoredFrom: backupPath }),
      user_name: 'SYSTEM',
    })
    if (auditError) throw auditError

    return NextResponse.json({ success: true, message: 'Sauvegarde restaurée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la restauration de la sauvegarde:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la restauration de la sauvegarde' },
      { status: 500 }
    )
  }
}
