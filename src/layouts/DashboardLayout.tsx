
import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavbar } from '@/components/dashboard/TopNavbar';
import { useAuthProtection } from '@/hooks/useAuthProtection';
import { LoadingIndicator } from '@/components/shared/LoadingIndicator';

export const DashboardLayout = () => {
  const { isLoading, isAuthenticated, userProfile } = useAuthProtection();

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
          <Outlet />
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
