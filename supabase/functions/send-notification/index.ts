// Notification sender for Noli.
//
// Creates a notification row for a given user. Called by the backend
// using a shared secret (Authorization / x-api-key header).
// verify_jwt is false in supabase/config.toml (no user JWT), donc la
// fonction se protège via un secret partagé : sans lui, tout appel est rejeté.

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
    // A-07 : vérification du secret partagé (défini côté serveur via
    // `supabase secrets set NOLI_FUNCTION_SECRET=...`).
    const secret = Deno.env.get('NOLI_FUNCTION_SECRET')
    if (!secret) {
      return Response.json(
        { error: 'Fonction non configurée (NOLI_FUNCTION_SECRET absent)' },
        { status: 500 },
      )
    }

    const provided =
      req.headers.get('x-api-key') ??
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

    if (!provided || provided !== secret) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

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
