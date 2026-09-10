import "server-only"

import Browserbase from "@browserbasehq/sdk"

// The core Browserbase SDK, for the platform APIs Stagehand doesn't cover —
// session recordings, replays, live views, logs. Holds the secret key, so it
// must never be imported from a client component.
export const browserbase = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY!,
})
