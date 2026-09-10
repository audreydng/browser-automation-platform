"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"
import * as Sentry from "@sentry/nextjs"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"

import { errorAttributes } from "@/lib/sentry"

import type { RunStep, runWorkflowTask } from "@/features/workflows/tasks/run-workflow"

type WorkflowRun = ReturnType<
  typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>["runs"][number]

// A run plus its resolved step list — what the console renders one row per.
// Spreads the whole run, so id, status, createdAt, durationMs and the run-level
// error come along for the header.
export type WorkflowRunWithSteps = WorkflowRun & {
  steps: RunStep[]
  isLive: boolean
  // The Browserbase session this run drove, once there is one to replay.
  browserbaseSessionId: string | undefined
}

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
      // Without this the hook keys its cache on a useId(), which is tied to this
      // provider's position in the tree — remount it and the accumulated runs
      // are dropped. Keying on the workflow keeps them across a remount.
      id: `workflow-runs:${workflowId}`,
      // Nothing renders the payload — only output.steps and metadata.steps.
      skipColumns: ["payload"],
    }
  )

  // A dropped subscription freezes the console and canvas on stale run state.
  useEffect(() => {
    if (!error) return

    Sentry.logger.warn("Workflow runs subscription failed", {
      ...errorAttributes(error),
      "workflow.id": workflowId,
    })
  }, [error, workflowId])

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

// A finished run's output is the source of truth — it is written once the run
// succeeds and never overwritten — so prefer it and fall back to the metadata
// the task publishes as it walks the nodes. A failed run has no output, so its
// last flushed metadata is what shows, with any oversized step output cut down
// to a preview (see the task's OUTPUT_PREVIEW_LIMIT).
function resolveSteps(run: WorkflowRun): RunStep[] {
  // Typed through the task; only present once the run has succeeded.
  const outputSteps = run.output?.steps
  // Metadata is untyped JSON on the wire, hence the cast. This is what shows
  // while the run is in flight, and all a failed run ever leaves behind.
  const metadataSteps = run.metadata?.steps as RunStep[] | undefined

  return outputSteps ?? metadataSteps ?? []
}

// The Browserbase session behind a run, for replaying what the browser did.
// Read only from the finished run's output, never from live metadata: the task
// returns the id on its way out, after closing the session, and the recording
// is not retrievable before that close anyway. So this stays undefined while a
// run is in flight, for a run that never opened a browser, and for a failed run
// — which returns no output at all.
function resolveSessionId(run: WorkflowRun): string | undefined {
  return run.output?.browserbaseSessionId
}

// Every run of this workflow, newest first, each with its steps resolved — the
// console's whole data source.
export function useWorkflowRunsWithSteps(): WorkflowRunWithSteps[] {
  const { runs } = useWorkflowRuns()

  return useMemo(
    () =>
      [...runs]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((run) => ({
          ...run,
          steps: resolveSteps(run),
          isLive: LIVE_STATUSES.includes(run.status),
          browserbaseSessionId: resolveSessionId(run),
        })),
    [runs]
  )
}

// The step list for the most recent run, plus whether that run is still going.
// What the canvas nodes read to show live per-node status.
export function useLatestRunSteps(): { steps: RunStep[]; isLive: boolean } {
  const [latest] = useWorkflowRunsWithSteps()

  return useMemo(
    () => ({ steps: latest?.steps ?? [], isLive: latest?.isLive ?? false }),
    [latest]
  )
}
