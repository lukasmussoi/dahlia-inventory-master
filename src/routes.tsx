import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./index";
import AuthRoutes from "./auth";
import Dashboard from "./dashboard";
import NotFound from "./not-found";
import Inventory from "./inventory";
import Suitcases from "./suitcases";
import Suppliers from "./suppliers";
import Categories from "./categories";
import Users from "./users";
import PlatingTypes from "./plating-types";
import DashboardContent from "@/components/dashboard/DashboardContent";
import InventoryReports from "./inventory/reports";
import InventoryLabelsRoute from "./inventory-labels";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Index />} />
        <Route path="/auth/*" element={<AuthRoutes />} />
        <Route path="/dashboard/*" element={<Dashboard />}>
          <Route index element={<DashboardContent />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/labels" element={<InventoryLabelsRoute />} />
          <Route path="inventory/reports" element={<InventoryReports />} />
          <Route path="suitcases" element={<Suitcases />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="plating-types" element={<PlatingTypes />} />
          <Route path="categories" element={<Categories />} />
          <Route path="settings">
            <Route path="users" element={<Users />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
