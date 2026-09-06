"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"

import type { RunStep, runWorkflowTask } from "@/features/workflows/tasks/run-workflow"

type WorkflowRun = ReturnType<
  typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>["runs"][number]

type WorkflowRunsContextValue = {
  runs: WorkflowRun[]
  error: Error | undefined
}

const WorkflowRunsContext = createContext<WorkflowRunsContextValue | null>(null)

// One realtime subscription to every run of this workflow, shared by the whole
// canvas. Runs are tagged `workflow:<id>` when triggered (see runWorkflowAction),
// so the tag subscription picks up new runs as they start without re-subscribing.
// `publicAccessToken` is minted server-side with read scope on that tag.
export function WorkflowRunsProvider({
  children,
  workflowId,
  publicAccessToken,
}: {
  children: ReactNode
  workflowId: string
  publicAccessToken: string
}) {
  const { runs, error } = useRealtimeRunsWithTag<typeof runWorkflowTask>(
    `workflow:${workflowId}`,
    {
      accessToken: publicAccessToken,
      // Nothing renders the payload — only output.steps and metadata.steps.
      skipColumns: ["payload"],
    }
  )

  const value = useMemo(() => ({ runs, error }), [runs, error])

  return (
    <WorkflowRunsContext value={value}>{children}</WorkflowRunsContext>
  )
}

export function useWorkflowRuns() {
  const context = useContext(WorkflowRunsContext)

  if (!context) {
    throw new Error("useWorkflowRuns must be used within a WorkflowRunsProvider")
  }

  return context
}

// A run is "live" while it is still waiting for or occupying a worker.
const LIVE_STATUSES = ["QUEUED", "EXECUTING"]

// The step list for the most recent run, plus whether that run is still going.
// A finished run's output is the source of truth — it is written once the run
// succeeds and never overwritten — so prefer it and fall back to the metadata
// the task publishes as it walks the nodes. A failed run has no output, so its
// last flushed metadata is what shows.
export function useLatestRunSteps(): { steps: RunStep[]; isLive: boolean } {
  const { runs } = useWorkflowRuns()

  return useMemo(() => {
    const latest = runs.reduce<WorkflowRun | undefined>(
      (newest, run) =>
        !newest || run.createdAt > newest.createdAt ? run : newest,
      undefined
    )

    if (!latest) return { steps: [], isLive: false }

    // Typed through the task; only present once the run has succeeded.
    const outputSteps = latest.output?.steps
    // Metadata is untyped JSON on the wire, hence the cast. This is what shows
    // while the run is in flight, and all a failed run ever leaves behind.
    const metadataSteps = latest.metadata?.steps as RunStep[] | undefined

    return {
      steps: outputSteps ?? metadataSteps ?? [],
      isLive: LIVE_STATUSES.includes(latest.status),
    }
  }, [runs])
}
