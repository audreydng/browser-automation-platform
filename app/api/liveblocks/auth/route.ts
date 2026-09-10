import { auth, currentUser } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"

import { liveblocks } from "@/lib/liveblocks"

export async function POST() {
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

  const user = await currentUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { body, status } = await liveblocks.identifyUser(
    {
      userId,
      groupIds: [orgId],
      organizationId: orgId,
    },
    {
      userInfo: {
        name:
          user.fullName ??
          user.username ??
          user.primaryEmailAddress?.emailAddress ??
          userId,
        avatar: user.imageUrl,
      },
    }
  )

  // Liveblocks answers with a status rather than throwing, so a failure here
  // would otherwise only show up as a canvas that never connects.
  if (status >= 400) {
    Sentry.logger.error("Liveblocks auth failed", {
      "org.id": orgId,
      "http.response.status_code": status,
    })
  }

  return new Response(body, { status })
}
