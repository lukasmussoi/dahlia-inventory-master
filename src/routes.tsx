import { lazy } from "react";

const DashboardPage = lazy(() => import("./routes/dashboard"));
const InventoryPage = lazy(() => import("./routes/inventory"));
const CategoriesPage = lazy(() => import("./routes/categories"));
const SuppliersPage = lazy(() => import("./routes/suppliers"));
const SuitcasesPage = lazy(() => import("./routes/suitcases"));
const SettingsPage = lazy(() => import("./routes/settings"));
const UsersPage = lazy(() => import("./routes/users"));
const PlatingTypesPage = lazy(() => import("./routes/plating-types"));
const InventoryReportsPage = lazy(() => import("./routes/inventory-reports"));

const routes = [
  {
    path: "dashboard",
    element: <DashboardPage />,
  },
  {
    path: "inventory",
    element: <InventoryPage />,
  },
  {
    path: "categories",
    element: <CategoriesPage />,
  },
  {
    path: "suppliers",
    element: <SuppliersPage />,
  },
  {
    path: "suitcases",
    element: <SuitcasesPage />,
  },
  {
    path: "settings",
    element: <SettingsPage />,
  },
  {
    path: "settings/users",
    element: <UsersPage />,
  },
  {
    path: "plating-types",
    element: <PlatingTypesPage />,
  },
  {
    path: "inventory/reports",
    element: <InventoryReportsPage />,
  },
];

export default routes;
