
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import {
  LayoutGrid,
  Tag,
  PackageOpen,
  Users,
  Settings,
  Package,
  Palette,
  UserCheck,
  ShoppingBag,
  Store
} from "lucide-react";

export default function DashboardSidebar() {
  const location = useLocation();
  const isMobile = useMobile();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const pathIncludes = (path: string) => {
    return location.pathname.includes(path);
  };

  if (isMobile) {
    return null;
  }

  const SidebarLink = ({ to, icon: Icon, label, isActive = false }: { to: string; icon: any; label: string; isActive?: boolean }) => (
    <Link to={to}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </Link>
  );

  return (
    <div className="pb-12 min-h-screen">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu Principal
          </h2>
          <div className="space-y-1">
            <Accordion
              type="multiple"
              defaultValue={[
                pathIncludes("/inventory") ? "inventory" : "",
                pathIncludes("/sales") ? "sales" : "",
              ]}
            >
              <AccordionItem value="inventory">
                <AccordionTrigger className="px-4">
                  <div className="flex items-center text-sm">
                    <Package className="mr-2 h-4 w-4" />
                    Estoque
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col space-y-1 pl-8">
                    <SidebarLink to="/dashboard/inventory" icon={LayoutGrid} label="Inventário" isActive={isActive("/dashboard/inventory")} />
                    <SidebarLink to="/dashboard/inventory/labels" icon={Tag} label="Etiquetas" isActive={isActive("/dashboard/inventory/labels")} />
                    <SidebarLink to="/dashboard/inventory/reports" icon={PackageOpen} label="Relatórios" isActive={isActive("/dashboard/inventory/reports")} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sales">
                <AccordionTrigger className="px-4">
                  <div className="flex items-center text-sm">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Vendas
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col space-y-1 pl-8">
                    <SidebarLink to="/dashboard/sales/resellers" icon={Store} label="Revendedoras" isActive={pathIncludes("/dashboard/sales/resellers")} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <SidebarLink to="/dashboard/categories" icon={LayoutGrid} label="Categorias" isActive={isActive("/dashboard/categories")} />
            <SidebarLink to="/dashboard/plating-types" icon={Palette} label="Tipos de Banho" isActive={isActive("/dashboard/plating-types")} />
            <SidebarLink to="/dashboard/suitcases" icon={PackageOpen} label="Maletas" isActive={isActive("/dashboard/suitcases")} />
            <SidebarLink to="/dashboard/suppliers" icon={UserCheck} label="Fornecedores" isActive={isActive("/dashboard/suppliers")} />
            <SidebarLink to="/dashboard/users" icon={Users} label="Usuários" isActive={isActive("/dashboard/users")} />
            <SidebarLink to="/dashboard/settings" icon={Settings} label="Configurações" isActive={isActive("/dashboard/settings")} />
          </div>
        </div>
      </div>
    </div>
  );
}
