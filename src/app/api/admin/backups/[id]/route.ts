import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { db } from '@/lib/db'
import { existsSync, unlinkSync, copyFileSync } from 'fs'
import { join } from 'path'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
    const { id } = await params

    const backup = await db.backup.findUnique({
      where: { id },
    })

    if (!backup) {
      return NextResponse.json(
        { error: 'Sauvegarde non trouvée' },
        { status: 404 }
      )
    }

    if (backup.path && existsSync(backup.path)) {
      try {
    const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
        unlinkSync(backup.path)
      } catch {
        // Le fichier peut ne plus exister
      }
    }

    await db.backup.delete({
      where: { id },
    })

    await db.auditLog.create({
      data: {
        action: 'BACKUP_DELETE',
        entity: 'Backup',
        entityId: id,
        details: JSON.stringify({ filename: backup.filename }),
        userName: 'SYSTEM',
      },
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

    const backup = await db.backup.findUnique({
      where: { id },
    })

    if (!backup) {
      return NextResponse.json(
        { error: 'Sauvegarde non trouvée' },
        { status: 404 }
      )
    }

    const backupPath = backup.path || join(process.cwd(), 'db', 'backups', backup.filename)
    const dbPath = join(process.cwd(), 'db', 'custom.db')

    if (!existsSync(backupPath)) {
      return NextResponse.json(
        { error: 'Fichier de sauvegarde introuvable' },
        { status: 404 }
      )
    }

    copyFileSync(backupPath, dbPath)

    await db.auditLog.create({
      data: {
        action: 'BACKUP_RESTORE',
        entity: 'Backup',
        entityId: id,
        details: JSON.stringify({ filename: backup.filename, restoredFrom: backupPath }),
        userName: 'SYSTEM',
      },
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