import { resend } from "@/lib/resend"

// Resend's sandbox sender — it needs no verified domain, but only delivers to
// the address on the Resend account. Swap for a verified domain to reach anyone.
const FROM = "onboarding@resend.dev"

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}) {
  // Plain text, not html: the body comes from a textarea, so its newlines
  // should survive rather than collapse the way they would in markup.
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject,
    text: body,
  })

  // The SDK reports API failures on `error` instead of throwing, so an
  // unchecked send would leave the step marked done having sent nothing.
  if (error) {
    throw new Error(`Resend failed to send email: ${error.message}`)
  }

  return { id: data.id }
}
