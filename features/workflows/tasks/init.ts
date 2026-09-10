import { tasks } from "@trigger.dev/sdk"
import * as Sentry from "@sentry/node"

// Trigger.dev loads this file before any task in this directory runs, so it's
// where the task runtime gets its own Sentry client — the Next.js one in
// sentry.server.config.ts never loads here. Both report to the same project.
Sentry.init({
  // The Node SDK's default integrations patch http, console, etc., which clashes
  // with Trigger.dev's own instrumentation. Errors are captured by hand below.
  defaultIntegrations: false,
  // SENTRY_DSN is what the Trigger.dev dashboard sets; locally, `trigger dev`
  // falls back to the DSN the Next.js app already reads from .env.local.
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NODE_ENV === "production" ? "production" : "development",
})

// Fires once per run, after the last retry fails — not on every attempt.
tasks.onFailure(async ({ payload, error, ctx }) => {
  Sentry.captureException(error, {
    tags: {
      task: ctx.task.id,
      triggerEnvironment: ctx.environment.type,
    },
    extra: { payload, runId: ctx.run.id, ctx },
  })
  // The run's process can be torn down as soon as this hook returns, taking any
  // unsent event with it.
  await Sentry.flush(2000)
})
