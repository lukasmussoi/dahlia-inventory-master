
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Router from "./routes";
import { useEffect, useState } from "react";
import { initializeSupabaseStorage } from "@/utils/supabaseInit";
import { toast } from "sonner";

// Criando uma instância do QueryClient
const queryClient = new QueryClient();

// Componente App que encapsula a aplicação com os providers necessários
const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  // Inicializar recursos do Supabase
  useEffect(() => {
    const initializeApp = async () => {
      setIsInitializing(true);
      try {
        // Inicializar recursos de armazenamento
        await initializeSupabaseStorage();
      } catch (error) {
        console.error("Erro durante a inicialização da aplicação:", error);
        toast.error("Falha ao inicializar armazenamento. Algumas funcionalidades podem não funcionar corretamente.");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        {/* Providers da interface do usuário */}
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {isInitializing ? (
            <div className="flex items-center justify-center h-screen">
              <p className="text-lg">Inicializando aplicação...</p>
            </div>
          ) : (
            <Router />
          )}
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
