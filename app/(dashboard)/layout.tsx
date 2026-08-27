import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider
      className="h-svh bg-background"
      style={
        {
          "--sidebar-width": "377px",
          "--sidebar-width-icon": "95px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden border bg-background shadow-none!">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
