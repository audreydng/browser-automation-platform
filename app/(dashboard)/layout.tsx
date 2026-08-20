import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider
      className="dark h-svh bg-[#1b1b1b]"
      style={
        {
          "--sidebar-width": "377px",
          "--sidebar-width-icon": "95px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden border bg-[#1b1b1b] shadow-none!">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
