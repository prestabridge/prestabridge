import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerVendorNotificationsAdmin } from '@/lib/notifications/vendors-admin'
import { Resend } from 'resend'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: processed, error: rpcError } = await admin.rpc('process_watchdog_batch', {
    p_limit: 50,
  })
  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 })

  const rows = (processed ?? []) as Array<{
    booking_id: string
    action_type: string
    old_vendor_id: string | null
    new_vendor_id: string | null
  }>

  const switched = rows.filter((r) => r.action_type === 'no_response_reassigned').map((r) => r.booking_id)
  const exhausted = rows.filter((r) => r.action_type === 'no_response_exhausted').map((r) => r.booking_id)

  if (switched.length > 0) {
    await triggerVendorNotificationsAdmin(admin, switched)
  }

  if (exhausted.length > 0) {
    const { data: exhaustedBookings } = await admin
      .from('bookings')
      .select('id, client_id')
      .in('id', exhausted)

    const clientIds = [...new Set((exhaustedBookings ?? []).map((b: any) => b.client_id))]
    const { data: clients } = await admin
      .from('profiles')
      .select('id, first_name, email')
      .in('id', clientIds)
    const clientMap = new Map((clients ?? []).map((c: any) => [c.id, c]))

    const resendKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const resend = resendKey && from ? new Resend(resendKey) : null

    if (resend) {
      for (const b of exhaustedBookings ?? []) {
        const client = clientMap.get(b.client_id)
        if (!client?.email) continue
        await resend.emails.send({
          from,
          to: [client.email],
          subject: 'Alerte Urgente IA - action requise sur votre scene',
          html: `
            <p>Bonjour ${client.first_name || ''},</p>
            <p>Nous n'avons recu aucune reponse des prestataires de votre cascade.</p>
            <p><strong>Alerte Urgente IA :</strong> rouvrez votre configurateur ou augmentez votre budget pour debloquer de nouvelles options.</p>
            <p><a href="${base}/onboarding">Reouvrir le configurateur</a></p>
          `,
        })
      }
    }
  }

  return NextResponse.json({
    success: true,
    processed: rows.length,
    switchedCount: switched.length,
    exhaustedCount: exhausted.length,
    switched,
    exhausted,
  })
}
