import { logger, metadata, task } from "@trigger.dev/sdk"
import { Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "@/features/workflows/nodes/node-executors"
import { getWorkflow } from "@/features/workflows/data"
import {
  interpolate,
  type NodeOutputs,
} from "@/features/workflows/lib/interpolate"
import { orderNodeIds } from "@/features/workflows/lib/order-node-ids"
import type { NodeType } from "@/features/workflows/nodes/node-registry"

// One entry per node the run will walk, published to the run's metadata under
// "steps" so the canvas and the run console can render live progress. Status
// moves pending → running → done, or → failed if the node's executor throws
// (which also stops the run).
//
// Everything the console shows lives here: `nodeType` and `title` name the node
// (the registry turns the type into an icon), `durationMs` times it, and
// `output`/`error` are whatever it produced. A node with no executor — `start`
// — settles as done with no output.
export type RunStep = {
  nodeId: string
  nodeType: NodeType
  title: string
  status: "pending" | "running" | "done" | "failed"
  // Epoch ms, set when the step starts. Lets the console tick a live duration
  // for the running step, which has no durationMs yet.
  startedAt?: number
  // Wall time from "running" to done or failed. Absent while pending/running.
  durationMs?: number
  output?: unknown
  // Set when the metadata copy of `output` was cut down to fit the size cap;
  // the run's return value always carries the whole thing. See publishSteps.
  outputTruncated?: boolean
  // The thrown error's message. Only ever set on a failed step.
  error?: string
}

// Run metadata caps out at 256KB for the whole run, and a single extract can
// blow past that on its own — which would break live updates for every step,
// not just the big one. So outputs are previewed on the wire and sent whole in
// the task's return value, which is what the console prefers once a run
// finishes.
const OUTPUT_PREVIEW_LIMIT = 2_000

function forPublishing(step: RunStep): RunStep {
  if (step.output === undefined) return step

  // undefined for a value JSON can't represent (a function, a bigint); treated
  // as over-long so the console shows the marker rather than silently nothing.
  const json = JSON.stringify(step.output)
  if (json !== undefined && json.length <= OUTPUT_PREVIEW_LIMIT) return step

  return {
    ...step,
    output: json?.slice(0, OUTPUT_PREVIEW_LIMIT),
    outputTruncated: true,
  }
}

// The Trigger.dev task the Run button fires. It loads the saved graph, works out
// what order the nodes should run in, and walks them. For now each node just
// announces itself — real execution (per-node executors, live progress, browser
// sessions) gets layered on from here.
export const runWorkflowTask = task({
  id: "run-workflow",
  run: async ({ workflowId, orgId }: { workflowId: string; orgId: string }) => {
    const workflow = await getWorkflow(orgId, workflowId)
    if (!workflow?.graph) throw new Error(`Workflow ${workflowId} has no graph`)

    const { nodes, edges } = workflow.graph
    const byId = new Map(nodes.map((n) => [n.id, n]))

    // Shared with the console's pre-run preview, so what it lists before you hit
    // Run is exactly what the run walks. Throws on a cycle, failing the run.
    const order = orderNodeIds({ nodes, edges })

    logger.log(`Running workflow ${workflow.name}`, { steps: order.length })

    // Seed the live step list before any work starts, every node pending, so the
    // canvas has the full plan up front. `steps` entries are mutated in place as
    // the run walks them; `publishSteps` re-pushes the whole array to metadata.
    const steps: RunStep[] = order.map((nodeId) => {
      const node = byId.get(nodeId)!
      return {
        nodeId,
        nodeType: node.data.type,
        title: node.data.title,
        status: "pending",
      }
    })
    const stepsById = new Map(steps.map((s) => [s.nodeId, s]))
    const publishSteps = () =>
      // Executor outputs are `unknown` to the type system but plain JSON in
      // practice, which is what metadata stores — hence the cast.
      metadata.set(
        "steps",
        steps.map(forPublishing) as Parameters<typeof metadata.set>[1]
      )
    publishSteps()

    // The run owns one Browserbase session, opened lazily on the first browser step
    // and reused by every later one, so the recording spans the whole flow. The
    // LLM routes through Browserbase's Model Gateway (BROWSERBASE_API_KEY), so no
    // separate provider key is needed.
      let stagehand: Stagehand | undefined
      // The Browserbase session this run drove, captured the moment it opens so
      // it outlives the close below — that recording is the only way to replay
      // what the browser actually did. A run of nothing but non-browser nodes
      // (send-email alone, say) never opens one and leaves this undefined.
      let browserbaseSessionId: string | undefined
      const getStagehand = async () => {
        if (stagehand) return stagehand
        stagehand = new Stagehand({
        env: "BROWSERBASE",
        apiKey: process.env.BROWSERBASE_API_KEY!,
        model: "google/gemini-2.5-flash",
        // Pino's logging backend spawns a thread-stream worker (lib/worker.js)
        // that can't be resolved inside trigger.dev's bundled output. Disable it —
        // the option exists for exactly these minimal/bundled environments.
        disablePino: true,
         })
         await stagehand.init()
         browserbaseSessionId = stagehand.browserbaseSessionID
         return stagehand
        }

    const outputs: NodeOutputs = {}
    const interpolationOutputs: NodeOutputs = {}

    for (const id of order) {
      const node = byId.get(id)!
      const step = stepsById.get(id)!
      logger.log(`Running step: ${node.data.title}`)

      const startedAt = Date.now()
      step.status = "running"
      step.startedAt = startedAt
      publishSteps()
      // Force the "running" state to the database now. The next status change is
      // synchronous and would overwrite it in the buffer before it's ever
      // flushed — the canvas would jump straight to "done" and never show the
      // spinner.
      await metadata.flush()

      const executor = nodeExecutors[node.data.type]
      try {
        if (executor) {
          // Dependency order guarantees referenced nodes have populated outputs.
          const values = Object.fromEntries(
            Object.entries(node.data.values).map(([key, text]) => [
              key,
              interpolate({ text, outputs: interpolationOutputs }),
            ])
          )
          const output = await executor({ values, getStagehand })
          outputs[id] = output
          step.output = output

          // Friendly titles power new tokens; ids keep existing saved tokens valid.
          interpolationOutputs[node.data.title] = output
          interpolationOutputs[id] = output
        }
      } catch (error) {
        step.status = "failed"
        step.durationMs = Date.now() - startedAt
        step.error = error instanceof Error ? error.message : String(error)
        publishSteps()
        // A thrown run returns no output, so this flush is the only way the
        // failed state ever reaches the canvas before the run stops.
        await metadata.flush()
        await stagehand?.close()
        throw error
      }

      step.status = "done"
      step.durationMs = Date.now() - startedAt
      publishSteps()
    }

    await stagehand?.close()

    // Return the final steps too, so a successful run's finished state is
    // guaranteed to reach the canvas even if a flush was still pending. The
    // session id rides along here rather than in metadata: its recording is not
    // retrievable until the session closes, which is the line above.
    return { steps, outputs, browserbaseSessionId }
  },
})
