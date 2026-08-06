// Notification sender for Noli.
//
// Creates a notification row for a given user. Called by the backend
// (or another Edge Function) using the secret key — auth mode: 'secret'.
// verify_jwt is set to false in supabase/config.toml for this function.

import { withSupabase } from 'npm:@supabase/server@^1'

interface NotificationPayload {
  user_id: string
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  title: string
  message: string
  link?: string
}

const sendNotification = {
  fetch: withSupabase({ auth: 'secret' }, async (req, ctx) => {
    const body = (await req.json()) as NotificationPayload

    if (!body.user_id || !body.title || !body.message) {
      return Response.json(
        { error: 'user_id, title and message are required' },
        { status: 400 },
      )
    }

    const { data, error } = await ctx.supabaseAdmin
      .from('notifications')
      .insert({
        user_id: body.user_id,
        type: body.type ?? 'INFO',
        title: body.title,
        message: body.message,
        link: body.link ?? null,
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ data }, { status: 201 })
  }),
}

export default sendNotification
