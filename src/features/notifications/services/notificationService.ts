import React from 'react'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { Database } from '@/types/database'

// Types
const DEFAULT_PRIORITY: NotificationPriority = 'medium'
const DEFAULT_CHANNELS: NotificationChannel[] = ['in_app']

type NotificationRow = Database['public']['Tables']['notifications']['Row']

type JsonObject = Record<string, any>

export type NotificationType = NotificationRow['type']
export type NotificationCategory = NotificationRow['category']
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'whatsapp' | 'push'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface NotificationData {
  quoteId?: string
  policyId?: string
  paymentId?: string
  amount?: number
  insurer?: string
  expiryDate?: string
  actionRequired?: boolean
  metadata?: Record<string, any>
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: NotificationData
  priority: NotificationPriority
  status: 'unread' | 'read' | 'archived'
  category: NotificationCategory
  channels: NotificationChannel[]
  actionUrl?: string | null
  actionText?: string | null
  metadata?: JsonObject
  expiresAt?: string | null
  createdAt: string
  readAt?: string
  isSystem: boolean
}

export interface NotificationFilters {
  type?: NotificationType
  category?: NotificationCategory
  status?: 'unread' | 'read' | 'archived'
  priority?: NotificationPriority
  dateRange?: {
    start: string
    end: string
  }
  search?: string
}

export interface NotificationStats {
  total: number
  unread: number
  today: number
  thisWeek: number
  thisMonth: number
}

export interface NotificationPreferences {
  userId: string
  channels: {
    email: boolean
    sms: boolean
    whatsapp: boolean
    push: boolean
    inApp: boolean
  }
  categories: Record<
    'quotes' | 'payments' | 'policies' | 'account' | 'security' | 'system' | 'marketing' | 'support',
    {
      enabled: boolean
      channels: NotificationChannel[]
    }
  >
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  frequency: 'immediate' | 'daily' | 'weekly'
}

const mapRowToNotification = (row: NotificationRow): Notification => {
  const metadata = (row.metadata as JsonObject) ?? {}
  const channels = Array.isArray(metadata.channels)
    ? (metadata.channels as NotificationChannel[]).filter(Boolean)
    : []
  const priority = (metadata.priority as NotificationPriority) ?? DEFAULT_PRIORITY
  const isArchived = metadata.archived === true
  const status: Notification['status'] = isArchived
    ? 'archived'
    : row.read
      ? 'read'
      : 'unread'

  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    data: metadata.data,
    priority,
    status,
    category: row.category,
    channels: channels.length ? channels : DEFAULT_CHANNELS,
    actionUrl: row.action_url,
    actionText: row.action_text,
    metadata,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    readAt: row.read ? row.updated_at : undefined,
    isSystem: metadata.isSystem ?? false,
  }
}

const createDefaultStats = (): NotificationStats => ({
  total: 0,
  unread: 0,
  today: 0,
  thisWeek: 0,
  thisMonth: 0,
})

const buildNotificationQuery = (
  userId: string,
  filters?: NotificationFilters
) => {
  const { status, category, type, priority, search, dateRange } = filters ?? {}
  const query = supabase
    .from('notifications')
    .select(
      'id, user_id, title, message, type, category, read, metadata, action_url, action_text, expires_at, created_at, updated_at',
      { count: 'exact' }
    )
    .eq('user_id', userId)

  const isArchiveFilter = status === 'archived'
  if (isArchiveFilter) {
    query.eq('metadata->archived', 'eq', 'true')
  } else {
    query.not('metadata->archived', 'eq', 'true')
    if (status === 'unread') {
      query.eq('read', false)
    } else if (status === 'read') {
      query.eq('read', true)
    }
  }

  if (category) {
    query.eq('category', category)
  }
  if (type) {
    query.eq('type', type)
  }
  if (priority) {
    query.eq('metadata->>priority', priority)
  }
  if (search) {
    const trimmed = search.trim()
    if (trimmed) {
      const pattern = `%${trimmed.replace(/%/g, '\%')}%`
      query.or(`title.ilike.${pattern},message.ilike.${pattern}`)
    }
  }
  if (dateRange) {
    query.gte('created_at', dateRange.start).lte('created_at', dateRange.end)
  }

  return query
}

// API functions
export const fetchNotifications = async (
  userId: string,
  filters?: NotificationFilters,
  page = 1,
  limit = 20
): Promise<{
  notifications: Notification[]
  total: number
  page: number
  totalPages: number
}> => {
  if (!userId) {
    throw new Error('Utilisateur non authentifié')
  }

  try {
    const start = (page - 1) * limit
    const end = start + limit - 1

    const query = buildNotificationQuery(userId, filters)
      .order('created_at', { ascending: false })
      .range(start, end)

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching notifications:', { error, userId, filters })
      return {
        notifications: [],
        total: 0,
        page,
        totalPages: 0,
      }
    }

    const notifications = (data ?? []).map(mapRowToNotification)
    const total = count ?? notifications.length
    const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1

    return {
      notifications,
      total,
      page,
      totalPages,
    }
  } catch (err) {
    logger.error('Error in fetchNotifications:', err)
    return {
      notifications: [],
      total: 0,
      page,
      totalPages: 0,
    }
  }
}

export const fetchUnreadNotifications = async (
  userId: string,
  limit = 50
): Promise<Notification[]> => {
  const { notifications } = await fetchNotifications(userId, { status: 'unread' }, 1, limit)
  return notifications
}

export const markNotificationAsRead = async (
  notificationId: string
): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select('*')
    .single()

  if (error || !data) {
    logger.error('Error marking notification as read:', { error, notificationId })
    throw error ?? new Error('Impossible de marquer la notification comme lue')
  }

  return mapRowToNotification(data)
}

export const markAllNotificationsAsRead = async (userId: string): Promise<number> => {
  if (!userId) {
    return 0
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .not('metadata->archived', 'eq', 'true')

  if (error) {
    logger.error('Error marking all notifications as read:', error)
    throw error
  }

  return data?.length ?? 0
}

export const archiveNotification = async (
  notificationId: string
): Promise<{ userId?: string }> => {
  const { data: existing, error: fetchError } = await supabase
    .from('notifications')
    .select('metadata, user_id')
    .eq('id', notificationId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    logger.error('Error fetching notification metadata for archive:', fetchError)
    throw fetchError
  }

  const metadata = (existing?.metadata as JsonObject) ?? {}
  metadata.archived = true

  const { error } = await supabase
    .from('notifications')
    .update({ metadata })
    .eq('id', notificationId)

  if (error) {
    logger.error('Error archiving notification:', { error, notificationId })
    throw error
  }

  return { userId: existing?.user_id }
}

export const deleteNotification = async (
  notificationId: string
): Promise<{ userId?: string }> => {
  const { data: existing, error: fetchError } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('id', notificationId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    logger.error('Error fetching notification for deletion:', fetchError)
    throw fetchError
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    logger.error('Error deleting notification:', { error, notificationId })
    throw error
  }

  return { userId: existing?.user_id }
}

export const fetchNotificationStats = async (
  userId: string
): Promise<NotificationStats> => {
  if (!userId) {
    return createDefaultStats()
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, read, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .not('metadata->archived', 'eq', 'true')
      .range(0, 9999)

    if (error) {
      logger.error('Error fetching notification stats:', error)
      return createDefaultStats()
    }

    const rows = data ?? []
    const total = rows.length
    const unread = rows.filter(row => !row.read).length
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const today = rows.filter(row => new Date(row.created_at) >= startOfDay).length
    const thisWeek = rows.filter(row => new Date(row.created_at) >= startOfWeek).length
    const thisMonth = rows.filter(row => new Date(row.created_at) >= startOfMonth).length

    return {
      total,
      unread,
      today,
      thisWeek,
      thisMonth,
    }
  } catch (err) {
    logger.error('Error in fetchNotificationStats:', err)
    return createDefaultStats()
  }
}

export const subscribeToNotifications = (
  userId: string,
  callback: (notification: NotificationRow) => void
) => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (payload.eventType !== 'DELETE' && payload.new) {
          callback(payload.new as NotificationRow)
        } else if (payload.eventType === 'DELETE' && payload.old) {
          callback(payload.old as NotificationRow)
        }
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}

// Preferences mock (retain existing structure)
const mockPreferences: NotificationPreferences = {
  userId: '1',
  channels: {
    email: true,
    sms: true,
    whatsapp: true,
    push: true,
    inApp: true,
  },
  categories: {
    quotes: { enabled: true, channels: ['in_app', 'email', 'sms'] },
    payments: { enabled: true, channels: ['in_app', 'email', 'sms'] },
    policies: { enabled: true, channels: ['in_app', 'email', 'sms', 'whatsapp'] },
    account: { enabled: true, channels: ['in_app', 'email'] },
    security: { enabled: true, channels: ['in_app', 'email', 'sms'] },
    system: { enabled: true, channels: ['in_app'] },
    marketing: { enabled: false, channels: [] },
    support: { enabled: true, channels: ['in_app', 'email'] },
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
  },
  frequency: 'immediate',
}

export const fetchNotificationPreferences = async (
  userId: string
): Promise<NotificationPreferences> => {
  await new Promise(resolve => setTimeout(resolve, 600))
  return { ...mockPreferences, userId }
}

export const updateNotificationPreferences = async (
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  await new Promise(resolve => setTimeout(resolve, 800))

  Object.assign(mockPreferences, preferences)
  return { ...mockPreferences, userId }
}

// React Query Hooks
export const useNotifications = (
  userId: string,
  filters?: NotificationFilters,
  page = 1,
  limit = 20
) => {
  return useQuery({
    queryKey: ['notifications', userId, filters, page, limit],
    queryFn: () => fetchNotifications(userId, filters, page, limit),
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
    enabled: !!userId,
  })
}

export const useNotificationsInfinite = (userId: string, filters?: NotificationFilters) => {
  return useInfiniteQuery({
    queryKey: ['notifications-infinite', userId, filters],
    queryFn: ({ pageParam = 1 }) => fetchNotifications(userId, filters, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
    enabled: !!userId,
  })
}

export const useUnreadNotifications = (userId: string) => {
  return useQuery({
    queryKey: ['unread-notifications', userId],
    queryFn: () => fetchUnreadNotifications(userId, 50),
    staleTime: 1 * 60 * 1000,
    enabled: !!userId,
  })
}

export const useMarkAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (notification) => {
      queryClient.invalidateQueries(['notifications', notification.userId])
      queryClient.invalidateQueries(['unread-notifications', notification.userId])
      queryClient.invalidateQueries(['notification-stats', notification.userId])
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage de la notification comme lue')
    },
  })
}

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: (_, userId) => {
      if (userId) {
        queryClient.invalidateQueries(['notifications', userId])
        queryClient.invalidateQueries(['unread-notifications', userId])
        queryClient.invalidateQueries(['notification-stats', userId])
        toast.success('Toutes les notifications ont été marquées comme lues')
      }
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage des notifications comme lues')
    },
  })
}

export const useArchiveNotification = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: archiveNotification,
    onSuccess: ({ userId }) => {
      if (userId) {
        queryClient.invalidateQueries(['notifications', userId])
        queryClient.invalidateQueries(['unread-notifications', userId])
      }
      toast.success('Notification archivée avec succès')
    },
    onError: (error) => {
      toast.error("Erreur lors de l'archivage de la notification")
    },
  })
}

export const useDeleteNotification = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: ({ userId }) => {
      if (userId) {
        queryClient.invalidateQueries(['notifications', userId])
        queryClient.invalidateQueries(['unread-notifications', userId])
        queryClient.invalidateQueries(['notification-stats', userId])
      }
      toast.success('Notification supprimée avec succès')
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de la notification')
    },
  })
}

export const useNotificationPreferences = (userId: string) => {
  return useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: () => fetchNotificationPreferences(userId),
    staleTime: 10 * 60 * 1000,
    enabled: !!userId,
  })
}

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, preferences }: { userId: string; preferences: Partial<NotificationPreferences> }) =>
      updateNotificationPreferences(userId, preferences),
    onSuccess: (preferences) => {
      queryClient.invalidateQueries(['notification-preferences', preferences.userId])
      toast.success('Préférences mises à jour avec succès')
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour des préférences')
    },
  })
}

export const useNotificationStats = (userId: string) => {
  return useQuery({
    queryKey: ['notification-stats', userId],
    queryFn: () => fetchNotificationStats(userId),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    enabled: !!userId,
  })
}

export const useRealTimeNotifications = (userId: string) => {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (!userId) {
      return
    }

    const unsubscribe = subscribeToNotifications(userId, (notification) => {
      queryClient.invalidateQueries(['notifications', userId])
      queryClient.invalidateQueries(['unread-notifications', userId])
      queryClient.invalidateQueries(['notification-stats', userId])

      if (!notification.read) {
        toast(notification.title, {
          description: notification.message,
          action: notification.actionText
            ? {
                label: notification.actionText,
                onClick: () => {
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl
                  }
                },
              }
            : undefined,
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [userId, queryClient])
}
