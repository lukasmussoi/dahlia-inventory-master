
import {
  Users,
  Package,
  Briefcase,
  Settings,
  LogOut,
  LayoutDashboard,
  Menu,
  Building2,
  FolderTree,
  Droplet,
  LineChart,
  Tag,
  UserCircle,
  ShoppingCart,
  User,
  ClipboardCheck
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface TopNavbarProps {
  isAdmin?: boolean;
}

export function TopNavbar({ isAdmin }: TopNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso");
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  // Items de menu baseados nas permissões do usuário
  const getMenuItems = () => {
    const baseMenuItems = [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        url: "/dashboard",
      },
      {
        title: "Estoque",
        icon: Package,
        url: "/dashboard/inventory",
        subItems: [
          {
            title: "Gestão de Estoque",
            url: "/dashboard/inventory",
            icon: Package,
          },
          {
            title: "Etiquetas",
            url: "/dashboard/inventory/labels",
            icon: Tag,
          },
          {
            title: "Relatórios",
            url: "/dashboard/inventory/reports",
            icon: LineChart,
          }
        ],
      },
      {
        title: "Maletas",
        icon: Briefcase,
        url: "/dashboard/suitcases",
        subItems: [
          {
            title: "Gestão de Maletas",
            url: "/dashboard/suitcases",
            icon: Briefcase,
          },
          {
            title: "Acertos",
            url: "/dashboard/suitcases/acertos",
            icon: ClipboardCheck,
          }
        ],
      }
    ];

    // Itens apenas para administradores
    if (isAdmin) {
      // Adicionar sub-itens ao Estoque para administradores
      const estoqueItem = baseMenuItems.find(item => item.title === "Estoque");
      if (estoqueItem && estoqueItem.subItems) {
        estoqueItem.subItems.push(
          {
            title: "Tipos de Banho",
            url: "/dashboard/plating-types",
            icon: Droplet,
          },
          {
            title: "Fornecedores",
            url: "/dashboard/suppliers",
            icon: Building2,
          },
          {
            title: "Categorias",
            url: "/dashboard/categories",
            icon: FolderTree,
          }
        );
      }

      // Adicionar itens específicos para admin
      baseMenuItems.push(
        {
          title: "Vendas",
          icon: ShoppingCart,
          url: "/dashboard/sales",
          subItems: [
            {
              title: "Revendedoras",
              url: "/dashboard/sales/resellers",
              icon: UserCircle,
            },
            {
              title: "Promotoras",
              url: "/dashboard/sales/promoters",
              icon: User,
            }
          ],
        },
        {
          title: "Configurações",
          icon: Settings,
          url: "/dashboard/settings",
          subItems: [
            {
              title: "Usuários",
              url: "/dashboard/settings/users",
              icon: Users,
            },
          ],
        }
      );
    }

    return baseMenuItems;
  };

  const menuItems = getMenuItems();

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl md:text-2xl font-semibold text-gold">
              Dália Manager
            </Link>
          </div>

          {/* Menu para desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => (
              item.subItems ? (
                <NavigationMenu key={item.title}>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="flex items-center gap-2">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4">
                          {item.subItems.map((subItem) => (
                            <li key={subItem.title}>
                              <Link
                                to={subItem.url}
                                className="flex items-center gap-2 p-2 hover:bg-gold/10 rounded-md transition-colors"
                              >
                                <subItem.icon className="h-5 w-5" />
                                <span>{subItem.title}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              ) : (
                <Link
                  key={item.title}
                  to={item.url}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gold/10 rounded-md transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              )
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>

          {/* Botão do menu mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gold/10"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden animate-slideIn">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white/80 backdrop-blur-lg">
            {menuItems.map((item) => (
              <div key={item.title}>
                <Link
                  to={item.url}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gold/10 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
                {item.subItems && (
                  <div className="pl-4 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.title}
                        to={subItem.url}
                        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gold/10 rounded-md transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <subItem.icon className="h-4 w-4" />
                        <span>{subItem.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
