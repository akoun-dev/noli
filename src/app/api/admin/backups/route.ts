import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { existsSync, mkdirSync, copyFileSync, statSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const backups = await db.backup.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ backups })
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
        db.systemSetting.upsert({
          where: { key: 'backup_schedule' },
          update: { value: JSON.stringify(schedule) },
          create: {
            key: 'backup_schedule',
            value: JSON.stringify(schedule),
            category: 'general',
            label: 'Planification sauvegarde',
            type: 'json',
          },
        }),
        db.systemSetting.upsert({
          where: { key: 'backup_enabled' },
          update: { value: String(enabled) },
          create: {
            key: 'backup_enabled',
            value: String(enabled),
            category: 'general',
            label: 'Sauvegarde automatique activée',
            type: 'boolean',
          },
        }),
      ])

      await db.auditLog.create({
        data: {
          action: 'SETTINGS_CHANGE',
          entity: 'Backup',
          details: JSON.stringify({ schedule, enabled }),
          userName: 'SYSTEM',
        },
      })

      return NextResponse.json({ success: true })
    }

    // Action par défaut : créer une sauvegarde manuelle
    const dbPath = join(process.cwd(), 'db', 'custom.db')

    if (!existsSync(dbPath)) {
      return NextResponse.json(
        { error: 'Fichier de base de données introuvable' },
        { status: 404 }
      )
    }

    const backupsDir = join(process.cwd(), 'db', 'backups')
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
      await db.auditLog.create({
        data: {
          action: 'BACKUP_CREATE',
          entity: 'Backup',
          details: JSON.stringify({ filename, error: 'Échec de la copie du fichier' }),
          userName: 'SYSTEM',
        },
      })

      return NextResponse.json(
        { error: 'Échec de la copie du fichier de base de données' },
        { status: 500 }
      )
    }

    const fileStat = statSync(destPath)
    const fileSize = fileStat.size

    const backup = await db.backup.create({
      data: {
        filename,
        fileSize,
        status: 'COMPLETED',
        type: 'MANUAL',
        path: destPath,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'BACKUP_CREATE',
        entity: 'Backup',
        entityId: backup.id,
        details: JSON.stringify({ filename, fileSize, type: 'MANUAL' }),
        userName: 'SYSTEM',
      },
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