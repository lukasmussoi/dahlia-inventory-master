
import {
  Users,
  Package,
  Briefcase,
  Settings,
  LogOut,
  LayoutDashboard,
  Building2,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TopNavbarProps {
  isAdmin?: boolean;
}

export function TopNavbar({ isAdmin }: TopNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      url: "/dashboard/inventory",
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
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-semibold text-gold">
              Dália Manager
            </h1>
          </div>

          {/* Menu para desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gold/10 rounded-md transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
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
              <Link
                key={item.title}
                to={item.url}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gold/10 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
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
