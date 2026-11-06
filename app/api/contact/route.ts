import { Resend } from "resend"

import { renderInquiryEmail } from "@/lib/contact-email"
import { contactSchema } from "@/lib/contact-schema"

const MAX_BODY_BYTES = 16_000
const DEFAULT_FROM = "Pal Bau weboldal <onboarding@resend.dev>"

function respond(status: number, body: { ok: boolean; error?: string }) {
  return Response.json(body, { status })
}

export async function POST(request: Request) {
  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    return respond(413, { ok: false, error: "invalid" })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return respond(400, { ok: false, error: "invalid" })
  }

  // A filled honeypot means a bot. Report success so it does not retry.
  if ((body as { website?: unknown } | null)?.website) {
    return respond(200, { ok: true })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) return respond(400, { ok: false, error: "invalid" })

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  if (!apiKey || !to) {
    console.error("Contact form: RESEND_API_KEY or CONTACT_TO_EMAIL is not set")
    return respond(503, { ok: false, error: "unavailable" })
  }

  const { error } = await new Resend(apiKey).emails.send({
    from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
    to,
    replyTo: parsed.data.email,
    ...renderInquiryEmail(parsed.data),
  })

  if (error) {
    console.error("Contact form: Resend rejected the email:", error.name)
    return respond(502, { ok: false, error: "unavailable" })
  }

  return respond(200, { ok: true })
}
