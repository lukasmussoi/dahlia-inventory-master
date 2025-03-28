
import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";

// Lazy-loaded routes
const Dashboard = lazy(() => import("@/routes/dashboard"));
const Inventory = lazy(() => import("@/routes/inventory"));
const Categories = lazy(() => import("@/routes/categories"));
const PlatingTypes = lazy(() => import("@/routes/plating-types"));
const Suppliers = lazy(() => import("@/routes/suppliers"));
const Users = lazy(() => import("@/routes/users"));
const Settings = lazy(() => import("@/routes/settings"));
const Auth = lazy(() => import("@/routes/auth"));
const Suitcases = lazy(() => import("@/routes/suitcases"));
const SuitcaseAcertos = lazy(() => import("@/routes/suitcases/acertos"));
const InventoryLabels = lazy(() => import("@/routes/inventory-labels"));
const InventoryLabelCreator = lazy(() => import("@/routes/inventory-label-creator"));
const InventoryReports = lazy(() => import("@/routes/inventory-reports"));
const Promoters = lazy(() => import("@/routes/sales/promoters"));
const PromoterForm = lazy(() => import("@/routes/sales/promoter-form"));
const Resellers = lazy(() => import("@/routes/sales/resellers"));
const ResellerForm = lazy(() => import("@/routes/sales/reseller-form"));

// Lazy loading wrapper
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<div className="flex justify-center items-center h-screen"><LoadingIndicator /></div>}>
    <Component />
  </Suspense>
);

const RoutesComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={withSuspense(Auth)} />
      
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={withSuspense(Dashboard)} />
        <Route path="inventory" element={withSuspense(Inventory)} />
        <Route path="inventory-labels" element={withSuspense(InventoryLabels)} />
        <Route path="inventory-label-creator" element={withSuspense(InventoryLabelCreator)} />
        <Route path="inventory-label-creator/:id" element={withSuspense(InventoryLabelCreator)} />
        <Route path="inventory-reports" element={withSuspense(InventoryReports)} />
        <Route path="categories" element={withSuspense(Categories)} />
        <Route path="plating-types" element={withSuspense(PlatingTypes)} />
        <Route path="suppliers" element={withSuspense(Suppliers)} />
        <Route path="users" element={withSuspense(Users)} />
        <Route path="settings" element={withSuspense(Settings)} />
        <Route path="suitcases" element={withSuspense(Suitcases)} />
        <Route path="suitcases/acertos" element={withSuspense(SuitcaseAcertos)} />
        <Route path="promoters" element={withSuspense(Promoters)} />
        <Route path="promoters/new" element={withSuspense(PromoterForm)} />
        <Route path="promoters/edit/:id" element={withSuspense(PromoterForm)} />
        <Route path="resellers" element={withSuspense(Resellers)} />
        <Route path="resellers/new" element={withSuspense(ResellerForm)} />
        <Route path="resellers/edit/:id" element={withSuspense(ResellerForm)} />
      </Route>
      
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
};

export default RoutesComponent;
