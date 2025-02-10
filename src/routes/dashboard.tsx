
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { AuthController } from "@/controllers/authController";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import Inventory from "./inventory";
import Suitcases from "./suitcases";
import Suppliers from "./suppliers";

const Dashboard = () => {
  const isMobile = useIsMobile();

  useEffect(() => {
    AuthController.checkAuth();
  }, []);

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
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-pearl to-pearl-dark">
        <div className="fixed left-0 top-0 h-full z-50 w-[5px]">
          <DashboardSidebar isAdmin={userProfile?.isAdmin} />
        </div>
        <div className="flex-1 ml-[5px] transition-all duration-300 ease-in-out">
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
};

export default Dashboard;
