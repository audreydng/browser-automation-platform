"use client"

import * as React from "react"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { Plus, SidebarIcon, Workflow } from "lucide-react"

import { Button } from "@/components/ui/button"
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

export function AppSidebar() {
  const { toggleSidebar } = useSidebar()
  const [activeWorkflow, setActiveWorkflow] = React.useState(workflows[0])

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
        <SidebarGroup className="px-[23px] py-[7px] group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
          <SidebarGroupLabel className="h-[38px] px-3 text-lg font-medium text-[#a5a5a5] group-data-[collapsible=icon]:hidden">
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
            <SidebarMenu className="gap-0 group-data-[collapsible=icon]:items-center">
              {workflows.map((workflow) => (
                <SidebarMenuItem key={workflow}>
                  <SidebarMenuButton
                    type="button"
                    tooltip={workflow}
                    isActive={activeWorkflow === workflow}
                    aria-label={`Select ${workflow} workflow`}
                    onClick={() => setActiveWorkflow(workflow)}
                    className="h-[51px] rounded-lg px-3 text-[21px] font-normal text-[#eeeeee] group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg hover:bg-[#242424] data-active:bg-[#242424] data-active:text-white [&_svg]:size-[18px] group-data-[collapsible=icon]:[&_svg]:size-6"
                  >
                    <Workflow />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {workflow}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
