
import { AuthModel } from "@/models/authModel";
import { toast } from "sonner";

export class AuthController {
  // Função para verificar autenticação e redirecionar se necessário
  static async checkAuth() {
    try {
      const user = await AuthModel.getCurrentUser();
      if (!user) {
        // Redirecionar para página de login se não estiver autenticado
        window.location.href = '/';
        return null;
      }
      return user;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      toast.error('Erro ao verificar autenticação. Por favor, faça login novamente.');
      window.location.href = '/';
      return null;
    }
  }

  // Função para buscar perfil do usuário com suas permissões
  static async getUserProfileWithRoles() {
    try {
      const data = await AuthModel.getCurrentUserProfile();
      
      // Verificar permissões do usuário
      if (data) {
        try {
          const isAdmin = await AuthModel.checkIsUserAdmin();
          return {
            ...data,
            isAdmin
          };
        } catch (error) {
          console.error('Erro ao verificar permissões:', error);
          return data;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      toast.error('Erro ao carregar perfil do usuário');
      throw error;
    }
  }
}
