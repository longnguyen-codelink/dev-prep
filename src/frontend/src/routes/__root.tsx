import { createRootRoute, Link, Outlet } from "@tanstack/react-router"
import LayoutDashboard from "lucide-react/dist/esm/icons/layout-dashboard.js"
import ArrowLeftRight from "lucide-react/dist/esm/icons/arrow-left-right.js"
import Tags from "lucide-react/dist/esm/icons/tags.js"
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check.js"
import { Separator } from "@/components/ui/separator"

export const Route = createRootRoute({
  component: RootLayout,
})

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
] as const

function RootLayout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center px-6 font-semibold text-lg">
          Finance Tracker
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&.active]:bg-sidebar-accent [&.active]:text-sidebar-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b px-6 md:hidden">
          <span className="font-semibold">Finance Tracker</span>
          <nav className="flex gap-2 ml-auto">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-accent [&.active]:bg-accent"
              >
                <item.icon className="h-3 w-3" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
