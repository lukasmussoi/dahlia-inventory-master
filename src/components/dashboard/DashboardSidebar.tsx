
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
      description: "Visão geral do sistema"
    },
    ...(isAdmin ? [
      {
        title: "Usuárias",
        icon: Users,
        url: "/dashboard/users",
        description: "Gerenciar usuárias"
      }
    ] : []),
    {
      title: "Estoque",
      icon: Package,
      url: "/dashboard/inventory",
      description: "Controle de estoque"
    },
    {
      title: "Maletas",
      icon: Briefcase,
      url: "/dashboard/suitcases",
      description: "Gerenciar maletas"
    },
    ...(isAdmin ? [
      {
        title: "Fornecedores",
        icon: Building2,
        url: "/dashboard/suppliers",
        description: "Gerenciar fornecedores"
      },
      {
        title: "Configurações",
        icon: Settings,
        url: "/dashboard/settings",
        description: "Configurações do sistema"
      }
    ] : []),
  ];

  const isCurrentRoute = (url: string) => {
    return window.location.pathname === url;
  };

  return (
    <Sidebar className="bg-white/80 backdrop-blur-lg border-r border-gray-200 transition-all duration-300 ease-in-out shadow-sm">
      <SidebarContent className="flex flex-col items-center">
        <div className="p-4 w-full text-center border-b border-gray-100">
          <h1 className={`text-xl md:text-2xl font-bold bg-gradient-to-r from-gold via-gold/90 to-gold/80 bg-clip-text text-transparent transition-all duration-300`}>
            {isMobile ? "DM" : "Dália Manager"}
          </h1>
        </div>
        <SidebarGroup className="w-full py-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="w-full px-2">
                  <SidebarMenuButton asChild>
                    <a
                      href={item.url}
                      className={`
                        flex items-center justify-center md:justify-start gap-3 
                        px-4 py-3 rounded-lg transition-all duration-200
                        group relative
                        ${isCurrentRoute(item.url) 
                          ? 'bg-gold/10 text-gold' 
                          : 'text-gray-700 hover:bg-gold/5'
                        }
                      `}
                    >
                      <item.icon className={`
                        h-5 w-5 flex-shrink-0 transition-transform duration-200
                        ${isCurrentRoute(item.url) ? 'text-gold' : 'text-gray-500'}
                        group-hover:scale-110
                      `} />
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                        {item.title}
                      </span>
                      {/* Tooltip para descrição */}
                      <div className="
                        absolute left-full ml-2 px-3 py-1 bg-gray-800 text-white text-sm
                        rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all duration-200 z-50 pointer-events-none
                        whitespace-nowrap
                      ">
                        {item.description}
                      </div>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem className="w-full px-2 mt-4">
                <SidebarMenuButton onClick={handleLogout}>
                  <div className="
                    flex items-center justify-center md:justify-start gap-3 
                    px-4 py-3 rounded-lg transition-all duration-200
                    text-red-600 hover:bg-red-50 cursor-pointer
                    group
                  ">
                    <LogOut className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                      Sair
                    </span>
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
