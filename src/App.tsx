
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
import EtiquetasCustomRoute from "./routes/etiquetas-custom";

const queryClient = new QueryClient();

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
            <Route path="inventory/etiquetas-custom" element={<EtiquetasCustomRoute />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
