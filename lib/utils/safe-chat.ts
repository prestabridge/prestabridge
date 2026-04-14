const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi

// Formats FR/INTL courants:
// 06 12 34 56 78, 06-12-34-56-78, 06.12.34.56.78, +33 6 12 34 56 78, 0033...
const PHONE_REGEX =
  /(?:\+|00)?\d{1,3}[\s.-]?(?:\(?\d+\)?[\s.-]?){6,}\d/g

const MASK = '[Coordonnées masquées avant validation]'

export function sanitizeMessage(content: string, bookingStatus: string) {
  if (bookingStatus === 'accepted') return content

  let sanitized = content
  sanitized = sanitized.replace(EMAIL_REGEX, MASK)
  sanitized = sanitized.replace(PHONE_REGEX, (match) => {
    // Réduit les faux positifs courts (ex: simple nombre)
    const digits = match.replace(/\D/g, '')
    return digits.length >= 9 ? MASK : match
  })

  return sanitized
}
