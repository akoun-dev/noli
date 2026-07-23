import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const guard = await requireAuth(["ADMIN"]); if (guard) return guard;
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || undefined
    const entity = searchParams.get('entity') || undefined
    const userId = searchParams.get('userId') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const search = searchParams.get('search') || undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit

    const where: Prisma.AuditLogWhereInput = {}

    if (action) {
      where.action = action
    }
    if (entity) {
      where.entity = entity
    }
    if (userId) {
      where.userId = userId
    }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }
    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { userEmail: { contains: search } },
        { action: { contains: search } },
        { entity: { contains: search } },
        { details: { contains: search } },
      ]
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userEmail: log.userEmail,
      userName: log.userName,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      details: (() => {
        try {
          return JSON.parse(log.details)
        } catch {
          return log.details
        }
      })(),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }))

    return NextResponse.json({
      logs: formattedLogs,
      total,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des journaux d\'audit:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des journaux d\'audit' },
      { status: 500 }
    )
  }
}