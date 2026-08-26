"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { RightSidebar } from "@/features/workflows/components/right-sidebar"

type WorkflowShellProps = {
  workflowId: string
}

export function WorkflowShell({ workflowId }: WorkflowShellProps) {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="size-full"
      data-workflow-id={workflowId}
    >
      <ResizablePanel minSize="30rem">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel minSize="18rem">Canvas</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="8rem" minSize="6rem">
            Logs
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="16rem" minSize="14rem" maxSize="36rem">
        <RightSidebar />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
