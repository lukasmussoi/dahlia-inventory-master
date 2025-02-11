
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import Inventory from "./inventory";
import Suitcases from "./suitcases";
import Suppliers from "./suppliers";
import Categories from "./categories";
import Users from "./users";

// Criar uma instância do QueryClient para o dashboard
const queryClient = new QueryClient();

const Dashboard = () => {
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => AuthController.getUserProfileWithRoles(),
  });

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pearl">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-pearl to-pearl-dark">
        <TopNavbar isAdmin={userProfile?.isAdmin} />
        <div className="pt-16">
          <Routes>
            <Route index element={<DashboardContent />} />
            <Route path="inventory">
              <Route index element={<Inventory />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="categories" element={<Categories />} />
            </Route>
            <Route path="suitcases" element={<Suitcases />} />
            <Route path="settings">
              <Route path="users" element={<Users />} />
            </Route>
          </Routes>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default Dashboard;
