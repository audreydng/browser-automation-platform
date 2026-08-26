"use client"

import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { PlayIcon } from "lucide-react"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { runWorkflowAction } from "@/features/workflows/actions"
import type { helloWorldTask } from "@/trigger/example"

type RunHandle = Awaited<ReturnType<typeof runWorkflowAction>>

const terminalStatuses = new Set([
  "COMPLETED",
  "CANCELED",
  "FAILED",
  "CRASHED",
  "INTERRUPTED",
  "SYSTEM_FAILURE",
  "EXPIRED",
  "TIMED_OUT",
])

function formatStatus(status: string) {
  const label = status.toLowerCase().replaceAll("_", " ")

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function RightSidebar() {
  const [isPending, startTransition] = useTransition()
  const [handle, setHandle] = useState<RunHandle>()
  const [actionError, setActionError] = useState<string>()
  const { run, error: realtimeError } = useRealtimeRun<typeof helloWorldTask>(
    handle?.id,
    {
      accessToken: handle?.publicAccessToken,
      enabled: Boolean(handle),
    }
  )

  const isRunning =
    isPending ||
    Boolean(handle && !run && !realtimeError) ||
    Boolean(run && !terminalStatuses.has(run.status))

  function handleRunWorkflow() {
    startTransition(async () => {
      try {
        setActionError(undefined)
        setHandle(undefined)

        const nextHandle = await runWorkflowAction()

        setHandle(nextHandle)
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : "Unable to start workflow"
        )
      }
    })
  }

  const feedback = actionError
    ? actionError
    : realtimeError
      ? realtimeError.message
      : run?.status === "COMPLETED"
        ? (run.output?.message ?? "Workflow completed")
        : run
          ? formatStatus(run.status)
          : handle
            ? "Connecting to run..."
            : undefined

  return (
    <div>
      <Button type="button" disabled={isRunning} onClick={handleRunWorkflow}>
        <PlayIcon />
        {isRunning ? "Running..." : "Run"}
      </Button>
      {feedback ? <p aria-live="polite">{feedback}</p> : null}
    </div>
  )
}
