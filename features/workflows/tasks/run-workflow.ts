import toposort from "toposort"
import { logger, metadata, task } from "@trigger.dev/sdk"
import { Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "@/features/workflows/nodes/node-executors"
import { getWorkflow } from "@/features/workflows/data"
import {
  interpolate,
  type NodeOutputs,
} from "@/features/workflows/lib/interpolate"

// One entry per node the run will walk, published to the run's metadata under
// "steps" so the canvas can render live progress. Status moves
// pending → running → done, or → failed if the node's executor throws (which
// also stops the run).
export type RunStep = {
  nodeId: string
  status: "pending" | "running" | "done" | "failed"
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

    // Run only connected nodes — anything touching an edge. Orphans dropped on
    // the canvas are skipped. toposort orders them and throws on a cycle.
    const connected = new Set(edges.flatMap((e) => [e.source, e.target]))
    const order = toposort
      .array(
        nodes.map((n) => n.id),
        edges.map((e) => [e.source, e.target])
      )
      .filter((id) => connected.has(id))

    logger.log(`Running workflow ${workflow.name}`, { steps: order.length })

    // Seed the live step list before any work starts, every node pending, so the
    // canvas has the full plan up front. `steps` entries are mutated in place as
    // the run walks them; `publishSteps` re-pushes the whole array to metadata.
    const steps: RunStep[] = order.map((nodeId) => ({ nodeId, status: "pending" }))
    const stepsById = new Map(steps.map((s) => [s.nodeId, s]))
    const publishSteps = () => metadata.set("steps", steps)
    publishSteps()

    // The run owns one Browserbase session, opened lazily on the first browser step
    // and reused by every later one, so the recording spans the whole flow. The
    // LLM routes through Browserbase's Model Gateway (BROWSERBASE_API_KEY), so no
    // separate provider key is needed.
      let stagehand: Stagehand | undefined
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
         return stagehand
        }

    const outputs: NodeOutputs = {}
    const interpolationOutputs: NodeOutputs = {}

    for (const id of order) {
      const node = byId.get(id)!
      const step = stepsById.get(id)!
      logger.log(`Running step: ${node.data.title}`)

      step.status = "running"
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

          // Friendly titles power new tokens; ids keep existing saved tokens valid.
          interpolationOutputs[node.data.title] = output
          interpolationOutputs[id] = output
        }
      } catch (error) {
        step.status = "failed"
        publishSteps()
        // A thrown run returns no output, so this flush is the only way the
        // failed state ever reaches the canvas before the run stops.
        await metadata.flush()
        await stagehand?.close()
        throw error
      }

      step.status = "done"
      publishSteps()
    }

    await stagehand?.close()

    // Return the final steps too, so a successful run's finished state is
    // guaranteed to reach the canvas even if a flush was still pending.
    return { steps, outputs }
  },
})
