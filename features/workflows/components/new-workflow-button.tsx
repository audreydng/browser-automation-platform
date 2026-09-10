"use client"

import * as Sentry from "@sentry/nextjs"
import { PlusIcon } from "lucide-react"
import { unstable_rethrow } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { createWorkflowAction } from "@/features/workflows/actions"
import { generateSlug } from "@/features/workflows/lib/generate-slug"
import { errorAttributes } from "@/lib/sentry"

// Creates a workflow with a generated name; the action redirects to it.
export function NewWorkflowButton() {
  const [isPending, startTransition] = useTransition()

  function handleCreateWorkflow() {
    startTransition(async () => {
      try {
        await createWorkflowAction(generateSlug())
      } catch (error) {
        // createWorkflowAction redirects on success, which throws — rethrow that
        // before treating anything as a failure.
        unstable_rethrow(error)
        Sentry.logger.error("Workflow creation failed", errorAttributes(error))
        toast.error("Could not create workflow.")
      }
    })
  }

  return (
    <Button disabled={isPending} onClick={handleCreateWorkflow}>
      <PlusIcon />
      New workflow
    </Button>
  )
}
