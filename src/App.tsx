
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Router from "./routes";

// Criando uma instância do QueryClient
const queryClient = new QueryClient();

// Componente App que encapsula a aplicação com os providers necessários
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Providers da interface do usuário */}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
