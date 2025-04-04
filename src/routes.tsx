
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import AuthRoutes from "@/routes/auth";
import Dashboard from "@/routes/dashboard";
import NotFound from "@/pages/NotFound";
import Inventory from "@/routes/inventory";
import Suitcases from "@/routes/suitcases";
import SuitcaseAcertos from "@/routes/suitcases/acertos";
import Suppliers from "@/routes/suppliers";
import Categories from "@/routes/categories";
import Users from "@/routes/users";
import PlatingTypes from "@/routes/plating-types";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import InventoryReports from "@/routes/inventory-reports";
import InventoryLabelsRoute from "@/routes/inventory-labels";
import InventoryLabelCreatorRoute from "@/routes/inventory-label-creator";
import ResellersPage from "@/routes/sales/resellers";
import PromotersPage from "@/routes/sales/promoters";
import ResellerFormPage from "@/routes/sales/reseller-form";
import PromoterFormPage from "@/routes/sales/promoter-form";
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
          <Route path="inventory/label-creator" element={<InventoryLabelCreatorRoute />} />
          <Route path="inventory/reports" element={<InventoryReports />} />
          <Route path="suitcases" element={<Suitcases />} />
          <Route path="suitcases/acertos" element={<SuitcaseAcertos />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="plating-types" element={<PlatingTypes />} />
          <Route path="categories" element={<Categories />} />
          <Route path="sales/resellers" element={<ResellersPage />} />
          <Route path="sales/resellers/new" element={<ResellerFormPage />} />
          <Route path="sales/resellers/:id" element={<ResellerFormPage />} />
          <Route path="sales/promoters" element={<PromotersPage />} />
          <Route path="sales/promoters/new" element={<PromoterFormPage />} />
          <Route path="sales/promoters/:id" element={<PromoterFormPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/users" element={<Users />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
