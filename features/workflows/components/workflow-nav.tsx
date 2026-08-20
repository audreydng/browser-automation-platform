"use client"

import * as React from "react"
import { Plus, Workflow } from "lucide-react"

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

const workflows = [
  "dominant-wasp",
  "honest-reindeer",
  "expected-llama",
  "essential-ocelot",
  "creepy-echidna",
  "eastern-silkworm",
  "cultural-lion",
  "proud-weasel",
  "regional-bonobo",
]

export function WorkflowNav() {
  const { state } = useSidebar()
  const [activeWorkflow, setActiveWorkflow] = React.useState(workflows[0])

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
                    <SidebarMenuButton type="button">
                      <Plus />
                      <span>New workflow</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
                <Separator />
                <SidebarMenu>
                  {workflows.map((workflow) => (
                    <SidebarMenuItem key={workflow}>
                      <SidebarMenuButton
                        type="button"
                        isActive={activeWorkflow === workflow}
                        onClick={() => setActiveWorkflow(workflow)}
                      >
                        <span>{workflow}</span>
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
        aria-label="Create a new workflow"
        title="Create a new workflow"
        className="top-[14px] right-[23px] size-8 rounded-lg text-[#eeeeee] hover:bg-[#282828] hover:text-white [&_svg]:size-5"
      >
        <Plus />
      </SidebarGroupAction>

      <SidebarGroupContent>
        <SidebarMenu>
          {workflows.map((workflow) => (
            <SidebarMenuItem key={workflow}>
              <SidebarMenuButton
                type="button"
                isActive={activeWorkflow === workflow}
                aria-label={`Select ${workflow} workflow`}
                onClick={() => setActiveWorkflow(workflow)}
                className="h-[51px] rounded-lg px-3 text-[21px] font-normal text-[#eeeeee] hover:bg-[#242424] data-active:bg-[#242424] data-active:text-white"
              >
                <span>{workflow}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
