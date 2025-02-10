
import {
  Users,
  Package,
  Briefcase,
  Settings,
  LogOut,
  LayoutDashboard,
  Building2,
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardSidebarProps {
  isAdmin?: boolean;
}

export function DashboardSidebar({ isAdmin }: DashboardSidebarProps) {
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      url: "/dashboard",
    },
    ...(isAdmin ? [
      {
        title: "Usuárias",
        icon: Users,
        url: "/dashboard/users",
      }
    ] : []),
    {
      title: "Estoque",
      icon: Package,
      url: "/inventory",
    },
    {
      title: "Maletas",
      icon: Briefcase,
      url: "/dashboard/suitcases",
    },
    ...(isAdmin ? [
      {
        title: "Fornecedores",
        icon: Building2,
        url: "/dashboard/suppliers",
      },
      {
        title: "Configurações",
        icon: Settings,
        url: "/dashboard/settings",
      }
    ] : []),
  ];

  return (
    <Sidebar className="bg-white/80 backdrop-blur-lg border-r border-gray-200">
      <SidebarContent>
        <div className="p-4">
          <h1 className={`text-xl md:text-2xl font-semibold text-gold transition-all ${isMobile ? 'text-center' : ''}`}>
            {isMobile ? "DM" : "Dália Manager"}
          </h1>
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
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.title}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <div className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer">
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">Sair</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
