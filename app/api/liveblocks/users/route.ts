import { auth, clerkClient } from "@clerk/nextjs/server"

const MAX_USER_IDS = 100

export async function POST(request: Request) {
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

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body || typeof body !== "object" || !("userIds" in body)) {
    return Response.json({ error: "userIds is required" }, { status: 400 })
  }

  const { userIds } = body

  if (
    !Array.isArray(userIds) ||
    !userIds.every((id): id is string => typeof id === "string")
  ) {
    return Response.json(
      { error: "userIds must be an array of strings" },
      { status: 400 }
    )
  }

  if (userIds.length > MAX_USER_IDS) {
    return Response.json(
      { error: `userIds cannot contain more than ${MAX_USER_IDS} entries` },
      { status: 400 }
    )
  }

  const uniqueUserIds = [...new Set(userIds)]

  if (uniqueUserIds.length === 0) {
    return Response.json([])
  }

  const clerk = await clerkClient()
  const { data: users } = await clerk.users.getUserList({
    userId: uniqueUserIds,
    organizationId: [orgId],
    limit: uniqueUserIds.length,
  })
  const usersById = new Map(users.map((user) => [user.id, user]))

  return Response.json(
    userIds.map((id) => {
      const user = usersById.get(id)

      if (!user) {
        return null
      }

      return {
        name:
          user.fullName ??
          user.username ??
          user.primaryEmailAddress?.emailAddress ??
          "Anonymous",
        avatar: user.imageUrl,
      }
    })
  )
}
