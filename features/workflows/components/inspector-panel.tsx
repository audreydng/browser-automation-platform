"use client"

import prettyMilliseconds from "pretty-ms"

import type { StepSelection } from "@/features/workflows/components/logs-panel"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import { useWorkflowRunsWithSteps } from "@/features/workflows/components/workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
import { cn } from "@/lib/utils"

// Shown when a step has neither output nor error, which reads differently
// depending on how far the run got.
function emptyNote(step: RunStep): string {
  if (step.status === "pending") return "This step hasn't run yet."
  if (step.status === "running") return "This step is still running."
  if (step.status === "failed") return "This step failed without a message."
  return "This step produced no output."
}

// The output as text. A truncated output is already a JSON string the task cut
// mid-structure to fit the metadata cap, so it can't be re-parsed or
// re-indented — it prints as-is. Anything else is pretty-printed.
function formatOutput(step: RunStep): string | null {
  if (step.output === undefined) return null
  if (step.outputTruncated) return String(step.output)

  // undefined for a value JSON can't represent, which reads as "nothing here"
  // rather than the literal string "undefined".
  return JSON.stringify(step.output, null, 2) ?? null
}

// The console's right half: what the selected step produced, or why it failed.
// Renders only while a step is selected — the parent ConsolePanel owns that.
export function InspectorPanel({ selection }: { selection: StepSelection }) {
  const runs = useWorkflowRunsWithSteps()

  const run = runs.find((candidate) => candidate.id === selection.runId)
  const step = run?.steps.find((candidate) => candidate.nodeId === selection.nodeId)

  // The selected run can drop out from under the selection — it ages out of the
  // realtime subscription, or its steps arrive empty before the first flush.
  if (!step) {
    return (
      <p className="p-3 text-xs text-muted-foreground">
        This step is no longer available.
      </p>
    )
  }

  const output = formatOutput(step)
  const isFailed = step.status === "failed"

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 px-3 py-2">
        <NodeIcon type={step.nodeType} className="size-5" />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-xs font-semibold",
            isFailed && "text-destructive"
          )}
        >
          {step.title}
        </span>
        {step.durationMs !== undefined && (
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
            {prettyMilliseconds(step.durationMs)}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 px-3 pb-3">
        {step.error ? (
          <pre className="rounded-(--radius) bg-destructive/10 p-2 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap text-destructive">
            {step.error}
          </pre>
        ) : output !== null ? (
          <>
            <pre className="rounded-(--radius) bg-muted p-2 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap">
              {output}
            </pre>
            {/* The full value still rides home on the run's return payload, so
                this note only ever shows for a run that is still in flight. */}
            {step.outputTruncated && (
              <p className="pt-1.5 text-[11px] text-muted-foreground">
                Output truncated while the run is live.
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{emptyNote(step)}</p>
        )}
      </div>
    </div>
  )
}
