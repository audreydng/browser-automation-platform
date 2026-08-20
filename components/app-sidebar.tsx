"use client"

import * as React from "react"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { Plus, SidebarIcon, Workflow } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

function WorkflowNav() {
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

export function AppSidebar() {
  const { toggleSidebar } = useSidebar()

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="h-[83px] flex-row items-center gap-2 px-[23px] py-[18px] group-data-[collapsible=icon]:h-16 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                rootBox: "w-full",
                organizationSwitcherTrigger:
                  "w-full justify-start gap-3.5 p-0 text-[#a5a5a5] hover:bg-transparent focus:shadow-none",
                organizationPreview: "gap-3.5",
                organizationPreviewAvatarBox: "size-[30px] rounded-lg",
                organizationPreviewMainIdentifier:
                  "text-[21px] font-medium text-[#a5a5a5]",
                organizationSwitcherTriggerIcon: "ml-1.5 size-4 text-[#a5a5a5]",
              },
            }}
          />
        </div>

        <div className="group-data-[collapsible=icon]:hidden">
          <SidebarTrigger className="size-8 shrink-0 rounded-lg text-[#eeeeee] hover:bg-[#282828] hover:text-white [&_svg]:size-5" />
        </div>

        <div className="hidden group-data-[collapsible=icon]:flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Expand sidebar"
                onClick={toggleSidebar}
                className="size-8 shrink-0 rounded-lg text-[#eeeeee] hover:bg-[#282828] hover:text-white [&_svg]:size-5"
              >
                <SidebarIcon />
                <span className="sr-only">Expand sidebar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        </div>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:overflow-x-hidden! group-data-[collapsible=icon]:overflow-y-auto! group-data-[collapsible=icon]:overscroll-contain">
        <WorkflowNav />
      </SidebarContent>

      <SidebarFooter className="items-start px-[23px] py-[23px] group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "size-[42px]",
            },
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
