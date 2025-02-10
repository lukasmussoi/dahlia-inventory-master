
import { useState } from "react";
import {
  Package, 
  Briefcase,
  Settings,
  LogOut,
  Building2,
  MenuIcon,
  ChevronLeft,
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
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardSidebarProps {
  isAdmin?: boolean;
}

export function DashboardSidebar({ isAdmin }: DashboardSidebarProps) {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(isMobile);

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
      title: "Estoque",
      icon: Package,
      url: "/dashboard/inventory",
      description: "Gerenciar produtos e estoque"
    },
    {
      title: "Maletas",
      icon: Briefcase,
      url: "/dashboard/suitcases",
      description: "Controle de maletas"
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
    <TooltipProvider>
      <Sidebar className="bg-card/80 backdrop-blur-lg border-r border-border/50 shadow-sm transition-all duration-300">
        <SidebarContent className="flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-border/50">
            <h1 className={`text-xl font-bold bg-gradient-to-r from-accent via-accent/90 to-accent/80 bg-clip-text text-transparent transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
              Dália Manager
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hover:bg-accent/10"
            >
              {isCollapsed ? (
                <MenuIcon className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
          </div>

          <SidebarGroup className="flex-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <a
                            href={item.url}
                            className={`
                              flex items-center gap-3 px-4 py-3 rounded-lg
                              transition-all duration-200 group relative w-full
                              ${isCurrentRoute(item.url) 
                                ? 'bg-accent/10 text-accent-foreground' 
                                : 'text-gray-700 hover:bg-accent/5'
                              }
                            `}
                          >
                            <item.icon className={`
                              h-5 w-5 flex-shrink-0 transition-transform duration-200
                              ${isCurrentRoute(item.url) ? 'text-accent-foreground' : 'text-gray-500'}
                              group-hover:scale-110
                            `} />
                            {!isCollapsed && (
                              <span className="font-medium truncate">
                                {item.title}
                              </span>
                            )}
                          </a>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" sideOffset={20}>
                          <p>{item.title}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="p-4 border-t border-border/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  {!isCollapsed && <span>Sair</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" sideOffset={20}>
                  <p>Sair do sistema</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
