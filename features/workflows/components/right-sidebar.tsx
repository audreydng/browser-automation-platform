"use client"

import { PlayIcon } from "lucide-react"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { runWorkflowAction } from "@/features/workflows/actions"

export function RightSidebar() {
  const [isPending, startTransition] = useTransition()

  function handleRunWorkflow() {
    startTransition(async () => {
      await runWorkflowAction()
    })
  }

  return (
    <Button type="button" disabled={isPending} onClick={handleRunWorkflow}>
      <PlayIcon />
      {isPending ? "Running..." : "Run"}
    </Button>
  )
}
