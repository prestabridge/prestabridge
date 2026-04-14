import { Resend } from 'resend'
import twilio from 'twilio'

function formatDateFR(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function normalizeE164Phone(raw?: string | null) {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('+')) return trimmed
  if (trimmed.startsWith('00')) return `+${trimmed.slice(2)}`
  if (trimmed.startsWith('0')) return `+33${trimmed.slice(1)}`
  return null
}

function buildFormalEmailHtml(input: {
  providerFirstName: string
  serviceTitle: string
  eventDate: string
  city: string
  amount: number
  actionUrl: string
}) {
  return `
  <div style="font-family:Arial,sans-serif;background:#0d0d0d;padding:24px;color:#f4f4f5;">
    <div style="max-width:620px;margin:0 auto;background:#151515;border:1px solid #d4af37;border-radius:12px;overflow:hidden;">
      <div style="padding:20px 24px;background:linear-gradient(120deg,#d4af37,#f6e27a);color:#111;">
        <h1 style="margin:0;font-size:20px;">Nouvelle demande validée - PrestaBridge</h1>
      </div>
      <div style="padding:24px;">
        <p>Bonjour ${input.providerFirstName},</p>
        <p>Une nouvelle demande vient d'etre validee par un client pour votre prestation <strong>${input.serviceTitle}</strong>.</p>
        <ul style="line-height:1.8;">
          <li><strong>Date :</strong> ${input.eventDate}</li>
          <li><strong>Lieu :</strong> ${input.city || 'A preciser'}</li>
          <li><strong>Budget de votre prestation :</strong> ${input.amount.toFixed(2)} EUR</li>
        </ul>
        <p>Vous disposez de <strong>4 heures</strong> pour accepter ou refuser la demande.</p>
        <p><a href="${input.actionUrl}">Ouvrir la demande (accepter / refuser)</a></p>
      </div>
    </div>
  </div>`
}

export async function triggerVendorNotificationsAdmin(
  admin: any,
  bookingIds: string[]
) {
  if (!bookingIds.length) return { success: true, results: [] }

  const resendApiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.RESEND_FROM_EMAIL
  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const twilioFromWhatsapp = process.env.TWILIO_WHATSAPP_FROM
  const twilioFromSms = process.env.TWILIO_SMS_FROM
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const resend = resendApiKey ? new Resend(resendApiKey) : null
  const twilioClient = twilioSid && twilioToken ? twilio(twilioSid, twilioToken) : null

  const { data: bookings } = await admin
    .from('bookings')
    .select('id, provider_id, service_id, booking_date, total_amount, cascade_position')
    .in('id', bookingIds)

  const providerIds = [...new Set((bookings ?? []).map((b: any) => b.provider_id))]
  const serviceIds = [...new Set((bookings ?? []).map((b: any) => b.service_id))]

  const [{ data: providers }, { data: services }] = await Promise.all([
    admin.from('profiles').select('id, first_name, email, phone').in('id', providerIds),
    admin.from('services').select('id, title, city').in('id', serviceIds),
  ])

  const providersMap = new Map((providers ?? []).map((p: any) => [p.id, p]))
  const servicesMap = new Map((services ?? []).map((s: any) => [s.id, s]))

  for (const booking of bookings ?? []) {
    const provider = providersMap.get(booking.provider_id)
    const service = servicesMap.get(booking.service_id)
    const eventDate = formatDateFR(booking.booking_date)
    const amount = Number(booking.total_amount || 0)
    const email = provider?.email
    const phone = normalizeE164Phone(provider?.phone)
    const actionUrl = `${baseUrl}/vendor/action/${booking.id}`
    const attemptRank = Math.max(1, Number(booking.cascade_position ?? 0) + 1)

    // Idempotence: si deja notifie recemment et sans reponse, on saute
    const { data: existingAttempt } = await admin
      .from('booking_provider_attempts')
      .select('status, notified_at, responded_at')
      .eq('booking_id', booking.id)
      .eq('provider_id', booking.provider_id)
      .single()

    if (
      existingAttempt &&
      existingAttempt.status === 'notified' &&
      !existingAttempt.responded_at &&
      Date.now() - new Date(existingAttempt.notified_at).getTime() < 10 * 60 * 1000
    ) {
      continue
    }
    const urgent = `🔥 PrestaBridge : Nouvelle demande validee pour le ${eventDate} ! Budget de votre prestation : ${amount.toFixed(
      2
    )}€. Vous avez 4h pour accepter ou refuser : ${actionUrl}`

    if (resend && emailFrom && email) {
      await resend.emails.send({
        from: emailFrom,
        to: [email],
        subject: `PrestaBridge - Nouvelle demande pour ${service?.title || 'votre prestation'}`,
        html: buildFormalEmailHtml({
          providerFirstName: provider?.first_name || 'Partenaire',
          serviceTitle: service?.title || 'Votre prestation',
          eventDate,
          city: service?.city || 'A preciser',
          amount,
          actionUrl,
        }),
      })
    }

    if (twilioClient && phone) {
      if (twilioFromWhatsapp) {
        await twilioClient.messages.create({
          body: urgent,
          from: twilioFromWhatsapp,
          to: `whatsapp:${phone}`,
        })
      } else if (twilioFromSms) {
        await twilioClient.messages.create({
          body: urgent,
          from: twilioFromSms,
          to: phone,
        })
      }
    }

    await admin
      .from('booking_provider_attempts')
      .upsert(
        {
          booking_id: booking.id,
          provider_id: booking.provider_id,
          status: 'notified',
          notified_at: new Date().toISOString(),
          responded_at: null,
          attempt_rank: attemptRank,
          channel: 'whatsapp_and_email',
        },
        { onConflict: 'booking_id,provider_id' }
      )
  }

  await admin
    .from('bookings')
    .update({ last_notified_at: new Date().toISOString() })
    .in('id', bookingIds)

  return { success: true }
}
