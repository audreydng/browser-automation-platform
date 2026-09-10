import { auth } from "@clerk/nextjs/server"
import { NotFoundError } from "@browserbasehq/sdk"

import { browserbase } from "@/lib/browserbase"

// Proxies a Browserbase session's HLS playlist to the browser. Only the playlist
// needs proxying: fetching it takes the secret API key, but the segment URIs
// inside it are pre-signed CDN links good for six hours, so the video itself
// streams straight from Browserbase to the player.
//
// Browserbase keeps writing a recording for a while after its session closes,
// and until it lands the replay endpoint 404s — the same answer it gives for a
// session that was never recorded at all. The two are indistinguishable from
// here, so both come back as 202 and it's the client's own deadline that
// decides when to stop waiting.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId, orgId } = await auth()

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!orgId) {
    return Response.json(
      { error: "An active organization is required" },
      { status: 403 }
    )
  }

  const { sessionId } = await params

  try {
    const replay = await browserbase.sessions.replays.retrieve(sessionId)

    // One page per tab the session opened. A run drives a single tab, so the
    // first page is the recording; metadata with no pages yet means Browserbase
    // is still writing it.
    const [page] = replay.pages

    if (!page) {
      return Response.json({ status: "pending" }, { status: 202 })
    }

    const playlist = await browserbase.sessions.replays.retrievePage(
      sessionId,
      page.pageId
    )

    return new Response(await playlist.text(), {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        // Those segment links expire, and a playlist fetched while the
        // recording was half-written would pin a short replay forever.
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return Response.json({ status: "pending" }, { status: 202 })
    }

    throw error
  }
}
