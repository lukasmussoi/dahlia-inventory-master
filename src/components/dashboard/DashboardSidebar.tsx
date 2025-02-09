
import {
  Users,
  Package,
  Briefcase,
  Settings,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard",
  },
  {
    title: "Usuários",
    icon: Users,
    url: "/dashboard/users",
  },
  {
    title: "Estoque",
    icon: Package,
    url: "/dashboard/inventory",
  },
  {
    title: "Maletas",
    icon: Briefcase,
    url: "/dashboard/suitcases",
  },
  {
    title: "Configurações",
    icon: Settings,
    url: "/dashboard/settings",
  },
];

export function DashboardSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4">
          <h1 className="text-2xl font-semibold text-gold">Dália Manager</h1>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.url}
                      className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gold/10 rounded-md transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
