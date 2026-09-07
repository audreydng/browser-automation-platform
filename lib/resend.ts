import { Resend } from "resend"

// No `server-only` marker here, unlike the other lib clients: this module is
// also pulled into the Trigger.dev task bundle by the send-email node, and
// `server-only` throws on import outside Next.js's react-server condition.
// RESEND_API_KEY has no NEXT_PUBLIC_ prefix, so it still never reaches a client
// bundle — and the API rejects browser calls anyway (no CORS, by design).
export const resend = new Resend(process.env.RESEND_API_KEY!)
