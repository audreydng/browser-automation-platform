"use client"

import prettyMilliseconds from "pretty-ms"
import { Video } from "lucide-react"

import { NodeIcon } from "@/features/workflows/components/node-icon"
import { useGraphPlan } from "@/features/workflows/hooks/use-graph-plan"
import {
  useWorkflowRuns,
  useWorkflowRunsWithSteps,
  type WorkflowRunWithSteps,
} from "@/features/workflows/components/workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

// What the console has open in its output pane, and there is only ever one. A
// step is unique only within its run — the same node appears in every run — so
// it takes both ids; a replay stands for the whole run, so the run id names it.
export type ConsoleSelection =
  | { kind: "step"; runId: string; nodeId: string }
  | { kind: "replay"; runId: string }

// One string per selectable thing, so comparing two selections — and toggling
// one off — never has to branch on the kind.
export function selectionKey(selection: ConsoleSelection): string {
  return selection.kind === "step"
    ? `step:${selection.runId}:${selection.nodeId}`
    : `replay:${selection.runId}`
}

function isSelected(
  current: ConsoleSelection | null,
  candidate: ConsoleSelection
): boolean {
  return current !== null && selectionKey(current) === selectionKey(candidate)
}

// Run statuses that mean the run ended badly, as opposed to COMPLETED (fine) or
// CANCELED (stopped on purpose). Drawn in the destructive color.
const FAILED_STATUSES = [
  "FAILED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "TIMED_OUT",
  "EXPIRED",
]

// pretty-ms on a step that has settled; nothing while it is still pending or
// running, where durationMs is not written yet.
function formatDuration(durationMs: number | undefined) {
  if (durationMs === undefined) return null
  return prettyMilliseconds(durationMs)
}

// Every row under a run header lines up on this, step or replay alike.
const ROW_CLASS_NAME =
  "flex w-full items-center gap-2.5 rounded-(--radius) py-1.5 pr-2 pl-7 text-left"

// One node's row under a run. Mirrors the canvas node's states: a spinner while
// it runs, destructive once it fails, and dimmed for a step the run never
// reached — a step after the one that threw, or one still queued.
function StepRow({
  step,
  isLive,
  isSelected,
  onSelect,
}: {
  step: RunStep
  isLive: boolean
  // Both omitted for the pre-run preview, whose steps have nothing to inspect.
  isSelected?: boolean
  onSelect?: () => void
}) {
  // A crashed or cancelled run can leave a step stuck on "running" forever, so
  // only spin while the run itself is still going — the same guard the canvas
  // node uses. "failed" is final and worth showing long after the run ends.
  const isRunning = step.status === "running" && isLive
  const isFailed = step.status === "failed"
  const isPending = step.status === "pending" || (step.status === "running" && !isLive)
  const duration = formatDuration(step.durationMs)

  const rowClassName = cn(ROW_CLASS_NAME, isPending && "opacity-50")

  const content = (
    <>
      <NodeIcon type={step.nodeType} running={isRunning} className="size-5" />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-xs font-medium",
          isFailed && "text-destructive"
        )}
      >
        {step.title}
      </span>
      {/* A running step has no duration yet, so this slot stays empty until it
          settles — the chip is what shows it is working. */}
      {duration && (
        <span
          className={cn(
            "shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground",
            isFailed && "text-destructive"
          )}
        >
          {duration}
        </span>
      )}
    </>
  )

  if (!onSelect) return <div className={rowClassName}>{content}</div>

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        rowClassName,
        "transition-colors hover:bg-accent",
        isSelected && "bg-accent"
      )}
    >
      {content}
    </button>
  )
}

// The run's browser recording. Sits with the step rows and selects the same
// way, but it stands for the whole run rather than any one node — hence the
// neutral chip instead of a NodeIcon.
function ReplayRow({
  selected,
  onSelect,
}: {
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        ROW_CLASS_NAME,
        "transition-colors hover:bg-accent",
        selected && "bg-accent"
      )}
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Video className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-xs font-medium">Replay</span>
    </button>
  )
}

// A run and its steps: one header line naming the run, then a row per node.
function RunGroup({
  run,
  plan,
  selected,
  onSelect,
}: {
  run: WorkflowRunWithSteps
  plan: RunStep[]
  selected: ConsoleSelection | null
  onSelect: (selection: ConsoleSelection) => void
}) {
  const isFailed = FAILED_STATUSES.includes(run.status)
  // The run's own duration, which the platform keeps — not the sum of the
  // steps', so it includes startup and any time between them.
  const duration = formatDuration(run.durationMs || undefined)

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1.5">
        {run.isLive ? (
          <Spinner className="size-3 shrink-0 text-muted-foreground" />
        ) : (
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              isFailed ? "bg-destructive" : "bg-muted-foreground/50"
            )}
          />
        )}
        <span
          className={cn(
            "text-xs font-semibold",
            isFailed && "text-destructive"
          )}
        >
          {run.status.replace(/_/g, " ").toLowerCase()}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
          {run.id}
        </span>
        {duration && (
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
            {duration}
          </span>
        )}
      </div>

      {/* A queued run has not published its plan yet, so stand in with the
          canvas's own — it is the list the run is about to walk. Only while the
          run is live: a finished run with no steps died before its first flush,
          and pretending it had steps would be a lie. */}
      {run.steps.length === 0 && run.isLive
        ? plan.map((step) => (
            <StepRow key={step.nodeId} step={step} isLive={false} />
          ))
        : run.steps.map((step) => {
            const selection: ConsoleSelection = {
              kind: "step",
              runId: run.id,
              nodeId: step.nodeId,
            }

            return (
              <StepRow
                key={step.nodeId}
                step={step}
                isLive={run.isLive}
                isSelected={isSelected(selected, selection)}
                onSelect={() => onSelect(selection)}
              />
            )
          })}

      {/* The session id only ever arrives on a finished run's output, so this
          row cannot show before the recording exists to ask for. The isLive
          check is belt and braces. */}
      {run.browserbaseSessionId && !run.isLive && (
        <ReplayRow
          selected={isSelected(selected, { kind: "replay", runId: run.id })}
          onSelect={() => onSelect({ kind: "replay", runId: run.id })}
        />
      )}
    </div>
  )
}

// The console's list: every run of this workflow, newest first, each with its
// steps below it. Selection lives in the parent ConsolePanel.
export function LogsPanel({
  selected,
  onSelect,
}: {
  selected: ConsoleSelection | null
  onSelect: (selection: ConsoleSelection) => void
}) {
  const runs = useWorkflowRunsWithSteps()
  const { error } = useWorkflowRuns()
  const plan = useGraphPlan()

  // A dead subscription looks exactly like a workflow that has never run, and
  // the usual cause — the page's read token has outlived its hour — is only
  // fixed by reloading. Say so instead of showing an empty console.
  if (error) {
    return (
      <div className="p-3">
        <p className="text-xs font-medium text-destructive">
          Lost the connection to the run feed.
        </p>
        <p className="pt-1 text-xs text-muted-foreground">
          Reload the page to reconnect. ({error.message})
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-1">
      {/* Before the first run there is nothing to subscribe to, so the console
          previews the steps a run would walk — the same list, same order, all
          pending. Nothing to inspect yet, hence no selection handlers. */}
      {runs.length === 0 ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
            <span className="text-xs font-semibold">not run yet</span>
          </div>
          {plan.length === 0 ? (
            <p className="px-2 pb-1.5 text-xs text-muted-foreground">
              Connect nodes on the canvas to see them here.
            </p>
          ) : (
            plan.map((step) => (
              <StepRow key={step.nodeId} step={step} isLive={false} />
            ))
          )}
        </div>
      ) : (
        runs.map((run) => (
          <RunGroup
            key={run.id}
            run={run}
            plan={plan}
            selected={selected}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  )
}
