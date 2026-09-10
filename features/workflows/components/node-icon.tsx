"use client"

import { Spinner } from "@/components/ui/spinner"
import {
  nodeRegistry,
  type NodeType,
} from "@/features/workflows/nodes/node-registry"
import { cn } from "@/lib/utils"

// The accent-colored icon chip, mirroring the node on the canvas. Shared by the
// sidebar — the toolbar, the editor header, the connection chips — and by the
// run console, so a node looks the same everywhere it is named.
export function NodeIcon({
  type,
  running,
  className,
}: {
  type: NodeType
  // Swaps the icon for a spinner inside the chip, so a step keeps its color and
  // its footprint in the row while it runs.
  running?: boolean
  className?: string
}) {
  const def = nodeRegistry[type]
  const Icon = def.icon

  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        def.accent,
        className
      )}
    >
      {running ? <Spinner className="size-3.5" /> : <Icon className="size-3.5" />}
    </span>
  )
}
