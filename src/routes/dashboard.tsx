
import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import Inventory from "./inventory";
import Suitcases from "./suitcases";
import Suppliers from "./suppliers";

const Dashboard = () => {
  useEffect(() => {
    AuthController.checkAuth();
  }, []);

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => AuthController.getUserProfileWithRoles(),
  });

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex bg-gradient-to-br from-background to-background/80">
        <DashboardSidebar isAdmin={userProfile?.isAdmin} />
        <div className="flex-1 lg:ml-[250px] ml-[70px] transition-all duration-300 ease-in-out p-4">
          <Routes>
            <Route index element={<DashboardContent />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="suitcases" element={<Suitcases />} />
            <Route path="suppliers" element={<Suppliers />} />
          </Routes>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default Dashboard;
