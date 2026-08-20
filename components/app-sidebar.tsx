import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { createWorkflowAction } from "@/features/workflows/actions"
import { WorkflowNav } from "@/features/workflows/components/workflow-nav"
import { listWorkflows } from "@/features/workflows/data"

export async function AppSidebar() {
  const { orgId } = await auth()
  const workflows = orgId ? await listWorkflows(orgId) : []

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
              <SidebarTrigger
                aria-label="Expand sidebar"
                className="size-8 shrink-0 rounded-lg text-[#eeeeee] hover:bg-[#282828] hover:text-white [&_svg]:size-5"
              />
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        </div>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:overflow-x-hidden! group-data-[collapsible=icon]:overflow-y-auto! group-data-[collapsible=icon]:overscroll-contain">
        <WorkflowNav
          workflows={workflows}
          createWorkflowAction={createWorkflowAction}
        />
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
