import {
  Home,
  Package,
  FolderTree,
  Truck,
  Droplets,
  Briefcase,
  Tag,
  Users,
  Settings,
  BarChart,
  Printer,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface MenuItem {
  title: string;
  href: string;
  icon: any;
  submenu: MenuItem[];
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    submenu: [],
  },
  {
    title: "Estoque",
    href: "/dashboard/inventory",
    icon: Package,
    submenu: [
      {
        title: "Produtos",
        href: "/dashboard/inventory",
        icon: Package,
      },
      {
        title: "Categorias",
        href: "/dashboard/categories",
        icon: FolderTree,
      },
      {
        title: "Fornecedores",
        href: "/dashboard/suppliers",
        icon: Truck,
      },
      {
        title: "Banhos",
        href: "/dashboard/plating-types",
        icon: Droplets,
      },
      {
        title: "Maletas",
        href: "/dashboard/suitcases",
        icon: Briefcase,
      },
      {
        title: "Etiquetas",
        href: "/dashboard/inventory/labels",
        icon: Tag,
      },
      {
        title: "Etiquetas Customizadas",
        href: "/dashboard/inventory/etiquetas-custom",
        icon: Printer,
      },
      {
        title: "Relatórios",
        href: "/dashboard/inventory-reports",
        icon: BarChart,
      },
    ],
  },
  {
    title: "Usuários",
    href: "/dashboard/users",
    icon: Users,
    submenu: [],
  },
  {
    title: "Configurações",
    href: "/dashboard/settings",
    icon: Settings,
    submenu: [],
  },
];

export function DashboardSidebar() {
  return (
    <div className="flex flex-col w-64 border-r bg-secondary">
      <div className="flex-1 px-4 py-6">
        <nav className="flex flex-col space-y-1">
          {menuItems.map((item) => (
            <div key={item.title}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-2 rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${
                    isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </NavLink>
              {item.submenu.length > 0 && (
                <div className="ml-4 flex flex-col space-y-1">
                  {item.submenu.map((subItem) => (
                    <NavLink
                      key={subItem.title}
                      to={subItem.href}
                      className={({ isActive }) =>
                        `flex items-center space-x-2 rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${
                          isActive ? "bg-accent text-accent-foreground" : ""
                        }`
                      }
                    >
                      <subItem.icon className="h-4 w-4" />
                      <span>{subItem.title}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
