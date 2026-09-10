"use client"

import * as Sentry from "@sentry/nextjs"
import { Lock, Plus, Workflow } from "lucide-react"
import Link from "next/link"
import { unstable_rethrow, usePathname } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

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
import { useProPlan } from "@/features/workflows/hooks/use-pro-plan"
import { generateSlug } from "@/features/workflows/lib/generate-slug"
import type { Workflow as WorkflowRecord } from "@/lib/db/schema"
import { errorAttributes } from "@/lib/sentry"

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
  const { isPro, isLoaded, upgrade } = useProPlan()

  // Only pro orgs can create workflows. createWorkflowAction enforces this
  // server-side too — this is the nudge, not the fence.
  const locked = isLoaded && !isPro

  function handleCreateWorkflow() {
    if (!isPro) {
      // Still resolving the session: neither create nor redirect until we know.
      if (isLoaded) {
        toast.error("Creating workflows is on the pro plan. Upgrade to continue.")
        upgrade()
      }
      return
    }

    startTransition(async () => {
      try {
        await createWorkflowAction(generateSlug())
      } catch (error) {
        // createWorkflowAction redirects on success, which throws — rethrow that
        // before treating anything as a failure.
        unstable_rethrow(error)
        Sentry.logger.error("Workflow creation failed", errorAttributes(error))
        toast.error("Could not create workflow.")
      }
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
                      title={
                        locked
                          ? "Creating workflows is available on the pro plan"
                          : undefined
                      }
                    >
                      {locked ? <Lock /> : <Plus />}
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
        aria-label={
          locked
            ? "Upgrade to the pro plan to create workflows"
            : "Create a new workflow"
        }
        title={
          locked
            ? "Creating workflows is available on the pro plan"
            : "Create a new workflow"
        }
        className="top-[14px] right-[23px] size-8 rounded-lg text-[#eeeeee] hover:bg-[#282828] hover:text-white [&_svg]:size-5"
      >
        {locked ? <Lock /> : <Plus />}
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
