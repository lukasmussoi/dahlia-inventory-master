
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthPage from "@/routes/auth";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar para a página de autenticação
    navigate("/auth");
  }, [navigate]);

  // Este componente será renderizado apenas brevemente antes do redirecionamento
  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl to-pearl-dark">
      <AuthPage />
    </div>
  );
};

export default Index;
