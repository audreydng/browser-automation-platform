import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Sends Sentry.logger.* calls to Sentry Logs
  enableLogs: true,

  // 100% of traces in development, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: 10% of all sessions, 100% of sessions with an error.
  // Replay masks all text and blocks media by default.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],
})

// Traces App Router navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
