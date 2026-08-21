"use client"

import { Plus, Workflow } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTransition } from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { generateSlug } from "@/features/workflows/lib/generate-slug"
import type { Workflow as WorkflowRecord } from "@/lib/db/schema"

type WorkflowNavProps = {
  workflows: WorkflowRecord[]
  createWorkflowAction: (name: string) => Promise<void>
}

export function WorkflowNav({
  workflows,
  createWorkflowAction,
}: WorkflowNavProps) {
  const { state } = useSidebar()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function handleCreateWorkflow() {
    startTransition(async () => {
      await createWorkflowAction(generateSlug())
    })
  }

  if (state === "collapsed") {
    return (
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  className="mx-auto"
                  aria-label="Open workflows"
                >
                  <Workflow />
                  <span>Workflows</span>
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent side="right" align="start">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      type="button"
                      disabled={isPending}
                      onClick={handleCreateWorkflow}
                    >
                      <Plus />
                      <span>New workflow</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
                <Separator />
                <SidebarMenu>
                  {workflows.map((workflow) => (
                    <SidebarMenuItem key={workflow.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/workflows/${workflow.id}`}
                      >
                        <Link href={`/workflows/${workflow.id}`}>
                          <span>{workflow.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup className="px-[23px] py-[7px]">
      <SidebarGroupLabel className="h-[38px] px-3 text-lg font-medium text-[#a5a5a5]">
        Workflows
      </SidebarGroupLabel>
      <SidebarGroupAction
        type="button"
        disabled={isPending}
        onClick={handleCreateWorkflow}
        aria-label="Create a new workflow"
        title="Create a new workflow"
        className="top-[14px] right-[23px] size-8 rounded-lg text-[#eeeeee] hover:bg-[#282828] hover:text-white [&_svg]:size-5"
      >
        <Plus />
      </SidebarGroupAction>

      <SidebarGroupContent>
        <SidebarMenu>
          {workflows.map((workflow) => (
            <SidebarMenuItem key={workflow.id}>
              <SidebarMenuButton
                asChild
                isActive={pathname === `/workflows/${workflow.id}`}
                aria-label={`Select ${workflow.name} workflow`}
                className="h-[51px] rounded-lg px-3 text-[21px] font-normal text-[#eeeeee] hover:bg-[#242424] data-active:bg-[#242424] data-active:text-white"
              >
                <Link href={`/workflows/${workflow.id}`}>
                  <span>{workflow.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
