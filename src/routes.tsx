
import { createBrowserRouter, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import DashboardLayout from "@/routes/dashboard";
import InventoryPage from "@/routes/inventory";
import InventoryLabelsPage from "@/routes/inventory-labels";
import InventoryReportsPage from "@/routes/inventory-reports";
import CategoriesPage from "@/routes/categories";
import PlatingTypesPage from "@/routes/plating-types";
import SuitcasesPage from "@/routes/suitcases";
import SuppliersPage from "@/routes/suppliers";
import UsersPage from "@/routes/users";
import SettingsPage from "@/routes/settings";
import AuthPage from "@/routes/auth";
import ResellersPage from "@/routes/sales/resellers";
import ResellerFormPage from "@/routes/sales/reseller-form";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard/inventory" replace />,
      },
      {
        path: "inventory",
        element: <InventoryPage />,
      },
      {
        path: "inventory/labels",
        element: <InventoryLabelsPage />,
      },
      {
        path: "inventory/reports",
        element: <InventoryReportsPage />,
      },
      {
        path: "categories",
        element: <CategoriesPage />,
      },
      {
        path: "plating-types",
        element: <PlatingTypesPage />,
      },
      {
        path: "suitcases",
        element: <SuitcasesPage />,
      },
      {
        path: "suppliers",
        element: <SuppliersPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "sales/resellers",
        element: <ResellersPage />,
      },
      {
        path: "sales/resellers/new",
        element: <ResellerFormPage />,
      },
      {
        path: "sales/resellers/:id",
        element: <ResellerFormPage />,
      }
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
