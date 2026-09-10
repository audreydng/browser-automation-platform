"use client"

import { useMemo } from "react"
import { useStore } from "@xyflow/react"

import { orderNodeIds } from "@/features/workflows/lib/order-node-ids"
import type { StepNodeType } from "@/features/workflows/nodes/node-registry"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

// The steps a run of the canvas as it stands would walk, all pending. It lets
// the console show the workflow's shape before its first run — and the moment
// Run is pressed, rather than sitting empty until the first realtime message
// lands. Shaped as RunStep so the same row component renders it.
export function useGraphPlan(): RunStep[] {
  const nodes = useStore((state) => state.nodes) as StepNodeType[]
  const edges = useStore((state) => state.edges)

  return useMemo(() => {
    const byId = new Map(nodes.map((node) => [node.id, node]))

    let order: string[]
    try {
      order = orderNodeIds({ nodes, edges })
    } catch {
      // A cycle mid-edit is a canvas still being wired up, not an error worth
      // blanking the console over. Fall back to canvas order — the run itself
      // is what rejects the cycle.
      order = nodes.map((node) => node.id)
    }

    return order.flatMap((id) => {
      const node = byId.get(id)
      if (!node) return []

      return [
        {
          nodeId: id,
          nodeType: node.data.type,
          title: node.data.title,
          status: "pending" as const,
        },
      ]
    })
  }, [nodes, edges])
}
