import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { LiveRefreshProvider } from "@/components/live/live-refresh-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

/**
 * Every figure on this dashboard is live operational data, so there is nothing
 * worth prerendering at build time — and attempting it would fail the build on
 * a machine that can't reach the API. Rendering per request also means the
 * build doesn't need the API running at all.
 */
export const dynamic = "force-dynamic"

/**
 * The dashboard shell. The polling provider is mounted here — once, above all
 * four routes — so a single timer drives the whole app rather than one per
 * widget.
 *
 * Nothing in this layout fetches, which is what lets each page's `loading`
 * boundary cover its own content while the shell stays painted.
 */
export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <LiveRefreshProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </LiveRefreshProvider>
  )
}
