
import { useEffect } from "react";
import { AuthController } from "@/controllers/authController";
import { toast } from "sonner";

const Suppliers = () => {
  useEffect(() => {
    // Verifica autenticação ao montar o componente
    AuthController.checkAuth();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
        <p className="text-gray-600">Gerencie os fornecedores do sistema</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Em desenvolvimento...</p>
      </div>
    </div>
  );
};

export default Suppliers;
