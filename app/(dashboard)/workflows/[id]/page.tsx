import { auth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { notFound } from "next/navigation"
import { ReactFlowProvider } from "@xyflow/react"

import { Room } from "@/features/workflows/components/room"
import { WorkflowRunsProvider } from "@/features/workflows/components/workflow-runs-provider"
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

  // Read-only token for the browser, scoped to just this workflow's run tag —
  // the same tag runWorkflowAction stamps on every run it triggers. An hour
  // comfortably outlives a run while keeping the blast radius small if it leaks.
  const publicAccessToken = await triggerAuth.createPublicToken({
    scopes: { read: { tags: [`workflow:${id}`] } },
    expirationTime: "1hr",
  })

  return (
    <Room roomId={id}>
      <ReactFlowProvider>
        <WorkflowRunsProvider
          workflowId={id}
          publicAccessToken={publicAccessToken}
        >
          <WorkflowShell workflowId={id} />
        </WorkflowRunsProvider>
      </ReactFlowProvider>
    </Room>
  )
}
