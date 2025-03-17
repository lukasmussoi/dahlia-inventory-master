
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import AuthRoutes from "@/routes/auth";
import Dashboard from "@/routes/dashboard";
import NotFound from "@/pages/NotFound";
import Inventory from "@/routes/inventory";
import Suitcases from "@/routes/suitcases";
import Suppliers from "@/routes/suppliers";
import Categories from "@/routes/categories";
import Users from "@/routes/users";
import PlatingTypes from "@/routes/plating-types";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import InventoryReports from "@/routes/inventory-reports";
import InventoryLabelsRoute from "@/routes/inventory-labels";
import ResellersPage from "@/routes/sales/resellers";
import ResellerFormPage from "@/routes/sales/reseller-form";
import SettingsPage from "@/routes/settings";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Index />} />
        <Route path="/auth/*" element={<AuthRoutes />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DashboardContent />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/labels" element={<InventoryLabelsRoute />} />
          <Route path="inventory/reports" element={<InventoryReports />} />
          <Route path="suitcases" element={<Suitcases />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="plating-types" element={<PlatingTypes />} />
          <Route path="categories" element={<Categories />} />
          <Route path="sales/resellers" element={<ResellersPage />} />
          <Route path="sales/resellers/new" element={<ResellerFormPage />} />
          <Route path="sales/resellers/:id" element={<ResellerFormPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/users" element={<Users />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
