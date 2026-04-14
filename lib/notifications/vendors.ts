import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import twilio from 'twilio'

type NotificationResult = {
  bookingId: string
  providerId: string
  emailSent: boolean
  whatsappSent: boolean
  errors: string[]
}

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
        <h3 style="margin-top:20px;">Details de l'evenement</h3>
        <ul style="line-height:1.8;">
          <li><strong>Date :</strong> ${input.eventDate}</li>
          <li><strong>Lieu :</strong> ${input.city || 'A preciser'}</li>
          <li><strong>Budget de votre prestation :</strong> ${input.amount.toFixed(2)} EUR</li>
        </ul>
        <p style="margin-top:20px;">Vous disposez de <strong>4 heures</strong> pour accepter ou refuser la demande.</p>
        <p style="margin-top:24px;">
          <a href="${input.actionUrl}" style="display:inline-block;padding:10px 16px;background:#d4af37;color:#111;text-decoration:none;border-radius:8px;font-weight:700;">
            Ouvrir la demande (accepter/refuser)
          </a>
        </p>
      </div>
    </div>
  </div>`
}

export async function triggerVendorNotifications(bookingIds: string[]) {
  if (!bookingIds.length) return { success: true, results: [] as NotificationResult[] }

  const supabase = await createClient()

  const resendApiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.RESEND_FROM_EMAIL

  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const twilioFromWhatsapp = process.env.TWILIO_WHATSAPP_FROM
  const twilioFromSms = process.env.TWILIO_SMS_FROM

  const resend = resendApiKey ? new Resend(resendApiKey) : null
  const twilioClient = twilioSid && twilioToken ? twilio(twilioSid, twilioToken) : null

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, provider_id, service_id, booking_date, total_amount, cascade_position')
    .in('id', bookingIds)

  if (error) {
    return { success: false, error: error.message, results: [] as NotificationResult[] }
  }

  const providerIds = [...new Set((bookings ?? []).map((b) => b.provider_id))]
  const serviceIds = [...new Set((bookings ?? []).map((b) => b.service_id))]

  const [{ data: providers }, { data: services }] = await Promise.all([
    supabase.from('profiles').select('id, first_name, email, phone').in('id', providerIds),
    supabase.from('services').select('id, title, city').in('id', serviceIds),
  ])

  const providersMap = new Map((providers ?? []).map((p) => [p.id, p]))
  const servicesMap = new Map((services ?? []).map((s) => [s.id, s]))

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const results: NotificationResult[] = []

  for (const booking of bookings ?? []) {
    const providerProfile = providersMap.get(booking.provider_id)
    const service = servicesMap.get(booking.service_id)

    const item: NotificationResult = {
      bookingId: booking.id,
      providerId: booking.provider_id,
      emailSent: false,
      whatsappSent: false,
      errors: [],
    }

    const providerFirstName = providerProfile?.first_name || 'Partenaire'
    const providerEmail = providerProfile?.email || null
    const eventDate = formatDateFR(booking.booking_date)
    const city = service?.city || 'A preciser'
    const serviceTitle = service?.title || 'Votre prestation'
    const amount = Number(booking.total_amount || 0)
    const actionUrl = `${baseUrl}/vendor/action/${booking.id}`

    // Idempotence: eviter double envoi pour meme booking/provider a court intervalle
    const { data: existingAttempt } = await supabase
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

    // 1) Email formel via Resend
    if (!resend || !emailFrom) {
      item.errors.push('Resend non configure (RESEND_API_KEY / RESEND_FROM_EMAIL).')
    } else if (!providerEmail) {
      item.errors.push('Email prestataire absent (profiles.email).')
    } else {
      try {
        await resend.emails.send({
          from: emailFrom,
          to: [providerEmail],
          subject: `PrestaBridge - Nouvelle demande pour ${serviceTitle}`,
          html: buildFormalEmailHtml({
            providerFirstName,
            serviceTitle,
            eventDate,
            city,
            amount,
            actionUrl,
          }),
        })
        item.emailSent = true
      } catch (e) {
        item.errors.push(`Erreur email Resend: ${e instanceof Error ? e.message : 'inconnue'}`)
      }
    }

    // 2) WhatsApp (ou SMS fallback) via Twilio
    const phone = normalizeE164Phone(providerProfile?.phone)
    if (!twilioClient) {
      item.errors.push('Twilio non configure (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN).')
    } else if (!phone) {
      item.errors.push('Numero prestataire absent ou invalide pour Twilio.')
    } else {
      const urgentMessage = `🔥 PrestaBridge : Nouvelle demande validee pour le ${eventDate} ! Budget de votre prestation : ${amount.toFixed(
        2
      )}€. Vous avez 4h pour accepter ou refuser : ${actionUrl}`

      try {
        if (twilioFromWhatsapp) {
          await twilioClient.messages.create({
            body: urgentMessage,
            from: twilioFromWhatsapp,
            to: `whatsapp:${phone}`,
          })
          item.whatsappSent = true
        } else if (twilioFromSms) {
          await twilioClient.messages.create({
            body: urgentMessage,
            from: twilioFromSms,
            to: phone,
          })
          item.whatsappSent = true
        } else {
          item.errors.push('TWILIO_WHATSAPP_FROM ou TWILIO_SMS_FROM manquant.')
        }
      } catch (e) {
        item.errors.push(`Erreur Twilio: ${e instanceof Error ? e.message : 'inconnue'}`)
      }
    }

    results.push(item)

    await supabase
      .from('booking_provider_attempts')
      .upsert(
        {
          booking_id: booking.id,
          provider_id: booking.provider_id,
          status: 'notified',
          notified_at: new Date().toISOString(),
          responded_at: null,
          attempt_rank: Math.max(1, Number((booking as any).cascade_position ?? 0) + 1),
          channel: 'whatsapp_and_email',
        },
        { onConflict: 'booking_id,provider_id' }
      )
  }

  const hasHardError = results.some((r) => !r.emailSent && !r.whatsappSent)
  return { success: !hasHardError, results }
}
