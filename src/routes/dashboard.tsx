
import { Outlet } from "react-router-dom";
import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useLocation } from "react-router-dom";

const Dashboard = () => {
  const { isLoading, isAuthenticated, userProfile } = useAuthProtection();
  const location = useLocation();
  const isExactlyDashboard = location.pathname === "/dashboard";

  // Se estiver carregando, mostrar indicador de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pearl to-pearl-dark">
        <TopNavbar isAdmin={false} />
        <div className="pt-16">
          <LoadingIndicator message="Carregando informações do usuário..." />
        </div>
      </div>
    );
  }

  // Se autenticado, mostrar o conteúdo do dashboard
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pearl to-pearl-dark">
        <TopNavbar isAdmin={userProfile?.isAdmin} />
        <div className="pt-16">
          {isExactlyDashboard ? <DashboardContent /> : <Outlet />}
        </div>
      </div>
    );
  }

  // Caso contrário, mostrar indicador de carregamento (redirecionamento será feito pelo hook)
  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl to-pearl-dark">
      <div className="pt-16">
        <LoadingIndicator message="Verificando autenticação..." />
      </div>
    </div>
  );
};

export default Dashboard;
