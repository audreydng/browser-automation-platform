import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs/config"

const nextConfig: NextConfig = {}

export default withSentryConfig(nextConfig, {
  org: "audrey-damg",
  project: "browser-automation-platform",

  // Uploads source maps on production builds so stack traces show original
  // code. Without the token the build still succeeds, just without upload.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,

  // Proxies browser events through the app so ad-blockers don't drop them.
  // Kept public in proxy.ts.
  tunnelRoute: "/monitoring",

  silent: !process.env.CI,
})
