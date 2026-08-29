import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { ReactFlowProvider } from "@xyflow/react"

import { Room } from "@/features/workflows/components/room"
import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import { getWorkflow } from "@/features/workflows/data"
import { liveblocks } from "@/lib/liveblocks"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { orgId } = await auth()

  if (!orgId) {
    notFound()
  }

  const workflow = await getWorkflow(orgId, id)

  if (!workflow) {
    notFound()
  }

  await liveblocks.getOrCreateRoom(id, {
    organizationId: orgId,
    defaultAccesses: [],
    groupsAccesses: {
      [orgId]: ["room:write"],
    },
  })

  return (
    <Room roomId={id}>
      <ReactFlowProvider>
        <WorkflowShell workflowId={id} />
      </ReactFlowProvider>
    </Room>
  )
}
