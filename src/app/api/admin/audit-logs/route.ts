import { NextRequest, NextResponse } from 'next/server'
import { db, mapRows } from '@/lib/db'
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

    const applyFilters = (q: any) => {
      if (action) q = q.eq("action", action)
      if (entity) q = q.eq("entity", entity)
      if (userId) q = q.eq("user_id", userId)
      if (startDate) q = q.gte("created_at", new Date(startDate).toISOString())
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        q = q.lte("created_at", end.toISOString())
      }
      if (search) {
        q = q.or(
          `user_name.ilike.%${search}%,user_email.ilike.%${search}%,action.ilike.%${search}%,entity.ilike.%${search}%,details.ilike.%${search}%`
        )
      }
      return q
    }

    const [{ data: logsData, error: logsError }, { count: total, error: countError }] =
      await Promise.all([
        applyFilters(
          db
            .from("audit_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .range(skip, skip + limit - 1)
        ),
        applyFilters(db.from("audit_logs").select("id", { count: "exact", head: true })),
      ])
    if (logsError) throw logsError
    if (countError) throw countError

    const logs = mapRows(logsData || [])

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
      total: total ?? 0,
      pages: Math.ceil((total ?? 0) / limit),
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des journaux d\'audit:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des journaux d\'audit' },
      { status: 500 }
    )
  }
}
