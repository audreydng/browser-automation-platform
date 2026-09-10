"use client"

import type { ReactNode } from "react"
import * as Sentry from "@sentry/nextjs"
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense"

import { Spinner } from "@/components/ui/spinner"
import { errorAttributes } from "@/lib/sentry"

export function Room({
  children,
  roomId,
}: {
  children: ReactNode
  roomId: string
}) {
  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint="/api/liveblocks/auth"
      resolveUsers={async ({ userIds }) => {
        try {
          const response = await fetch("/api/liveblocks/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds }),
          })

          // Unresolved users still collaborate, just without names or avatars —
          // so these are warnings, and the only trace the failure leaves.
          if (!response.ok) {
            Sentry.logger.warn("Could not resolve Liveblocks users", {
              "http.response.status_code": response.status,
              "liveblocks.user_count": userIds.length,
            })
            return undefined
          }

          return await response.json()
        } catch (error) {
          Sentry.logger.warn("Could not resolve Liveblocks users", {
            ...errorAttributes(error),
            "liveblocks.user_count": userIds.length,
          })
          return undefined
        }
      }}
    >
      <RoomProvider id={roomId}>
        <ClientSideSuspense
          fallback={
            <div className="flex size-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              <span>Loading workflow…</span>
            </div>
          }
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
