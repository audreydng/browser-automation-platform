"use client"

import type { ReactNode } from "react"
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense"

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
      publicApiKey={
        "pk_dev_W9QjNnn6z1p5sGLxY27sr5eIoCRqmUa0r8Og1k42eGob_4vwarWeanvwixHPytLp"
      }
    >
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
