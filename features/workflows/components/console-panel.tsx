"use client"

import { useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { InspectorPanel } from "@/features/workflows/components/inspector-panel"
import {
  LogsPanel,
  type StepSelection,
} from "@/features/workflows/components/logs-panel"

// The console under the canvas. It owns which step is selected — the list only
// reports clicks — so the detail view that renders a step's output and error can
// sit beside the list and read the same selection.
export function ConsolePanel() {
  const [selected, setSelected] = useState<StepSelection | null>(null)

  // Clicking the selected step again clears it, so a step row toggles.
  const selectStep = (next: StepSelection) =>
    setSelected((current) =>
      current?.runId === next.runId && current.nodeId === next.nodeId
        ? null
        : next
    )

  return (
    <div className="flex size-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-3 py-1.5 text-sm font-semibold">
        Console
      </div>
      <div className="flex min-h-0 flex-1">
        {/* Panels scroll their own content, so neither side needs an overflow
            class. Explicit ids keep the group's layout pinned to the logs panel
            as the inspector comes and goes. */}
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="logs" minSize="12rem">
            <LogsPanel selected={selected} onSelectStep={selectStep} />
          </ResizablePanel>
          {/* Only mounted while something is selected, so the list gets the
              whole panel back the moment a step is toggled off. */}
          {selected && (
            <>
              <ResizableHandle />
              <ResizablePanel
                id="inspector"
                defaultSize="50%"
                minSize="14rem"
                maxSize="42rem"
                // Widening the console shouldn't stretch the output view — the
                // logs list absorbs the extra room instead.
                groupResizeBehavior="preserve-pixel-size"
              >
                <InspectorPanel selection={selected} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
