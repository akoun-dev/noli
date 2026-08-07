import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { db, mapRow } from '@/lib/db'
import { promises as fs } from 'fs'
import { logAudit } from '@/lib/audit'
import { resolveBackupPath, DB_PATH } from '@/lib/backups'

async function findBackup(id: string) {
  const { data } = await db.from("backups").select("id, path, filename").eq("id", id).maybeSingle()
  return mapRow<{ id: string; path: string | null; filename: string }>(data)
}

export async function GET(
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

    // H-07 : le chemin est reconstruit depuis le nom de fichier relatif.
    const backupPath = resolveBackupPath(backup.filename, backup.path)
    try {
      await fs.access(backupPath)
    } catch {
      return NextResponse.json(
        { error: 'Fichier de sauvegarde introuvable sur le serveur' },
        { status: 404 }
      )
    }

    const content = await fs.readFile(backupPath)
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${backup.filename.replace(/"/g, '')}"`,
      },
    })
  } catch (error) {
    console.error('Erreur lors du téléchargement de la sauvegarde:', error)
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement de la sauvegarde' },
      { status: 500 }
    )
  }
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

    const backupPath = resolveBackupPath(backup.filename, backup.path)
    try {
      await fs.unlink(backupPath)
    } catch {
      // Le fichier peut ne plus exister
    }

    const { error } = await db.from("backups").delete().eq("id", id)
    if (error) throw error

    await logAudit({
      action: 'BACKUP_DELETE',
      entity: 'Backup',
      entityId: id,
      details: { filename: backup.filename },
    })

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

    const backupPath = resolveBackupPath(backup.filename, backup.path)
    const dbPath = DB_PATH

    try {
      await fs.access(backupPath)
    } catch {
      return NextResponse.json(
        { error: 'Fichier de sauvegarde introuvable' },
        { status: 404 }
      )
    }

    await fs.copyFile(backupPath, dbPath)

    await logAudit({
      action: 'BACKUP_RESTORE',
      entity: 'Backup',
      entityId: id,
      details: { filename: backup.filename },
    })

    return NextResponse.json({ success: true, message: 'Sauvegarde restaurée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la restauration de la sauvegarde:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la restauration de la sauvegarde' },
      { status: 500 }
    )
  }
}
