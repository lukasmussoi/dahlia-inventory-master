
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./routes/auth";
import Dashboard from "./routes/dashboard";
import NotFound from "./pages/NotFound";
import Inventory from "./routes/inventory";
import InventoryLabelsRoute from "./routes/inventory-labels";
import LabelsCustomRoute from "./routes/labels-custom";
import LabelCustomViewerRoute from "./routes/label-custom-viewer";
import Categories from "./routes/categories";
import Suppliers from "./routes/suppliers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/dashboard/*" element={<Dashboard />}>
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory/labels" element={<InventoryLabelsRoute />} />
            <Route path="inventory/labels/custom" element={<LabelsCustomRoute />} />
            <Route path="inventory/labels/custom/:id" element={<LabelCustomViewerRoute />} />
            <Route path="inventory/categories" element={<Categories />} />
            <Route path="inventory/suppliers" element={<Suppliers />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
