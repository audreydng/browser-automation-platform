"use client"

import { useMemo } from "react"
import { getIncomers, useEdges, useNodes } from "@xyflow/react"

import {
  nodeRegistry,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"

export type UpstreamConnection = {
  value: string
  label: string
  type: NodeType
}

// Collects every declared output reachable upstream of the selected node and
// formats it as a friendly, ready-to-insert connection option.
export function useUpstreamConnections(
  selectedNode: StepNodeType | undefined
): UpstreamConnection[] {
  const nodes = useNodes<StepNodeType>()
  const edges = useEdges()

  return useMemo(() => {
    if (!selectedNode) return []

    const upstreamNodes: StepNodeType[] = []
    const visited = new Set([selectedNode.id])

    const visit = (node: StepNodeType) => {
      for (const incomer of getIncomers(node, nodes, edges)) {
        if (visited.has(incomer.id)) continue

        visited.add(incomer.id)
        visit(incomer)
        upstreamNodes.push(incomer)
      }
    }

    visit(selectedNode)

    return upstreamNodes.flatMap((node) =>
      nodeRegistry[node.data.type].outputs.map((output) => {
        const fieldValue = node.data.values[output.key]

        return {
          // Known field-backed outputs can be inserted directly before a run.
          value: fieldValue || `{{ ${node.data.title}.${output.key} }}`,
          label: `${node.data.title} · ${output.label}`,
          type: node.data.type,
        }
      })
    )
  }, [edges, nodes, selectedNode])
}
