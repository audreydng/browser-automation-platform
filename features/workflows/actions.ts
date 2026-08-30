"use server"

import { auth } from "@clerk/nextjs/server"
import { tasks } from "@trigger.dev/sdk"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { liveblocks } from "@/lib/liveblocks"
import type { helloWorldTask } from "@/trigger/example"

import { createWorkflow, deleteWorkflow, getWorkflow } from "./data"

export async function createWorkflowAction(name: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  const workflow = await createWorkflow(orgId, name)

  revalidatePath("/", "layout")
  redirect(`/workflows/${workflow.id}`)
}

export async function runWorkflowAction() {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  return tasks.trigger<typeof helloWorldTask>("hello-world", {
    message: "Hello from right-sidebar!",
  })
}

export async function deleteWorkflowAction(workflowId: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  const workflow = await getWorkflow(orgId, workflowId)

  if (!workflow) {
    throw new Error("Workflow not found")
  }

  await liveblocks.deleteRoom(workflow.id)
  await deleteWorkflow(orgId, workflow.id)

  revalidatePath("/", "layout")
  redirect("/")
}
