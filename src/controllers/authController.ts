
import { AuthModel } from "@/models/authModel";
import { toast } from "sonner";

export class AuthController {
  // Função para verificar autenticação e redirecionar se necessário
  static async checkAuth() {
    try {
      const user = await AuthModel.getCurrentUser();
      if (!user) {
        // O usuário deve ser redirecionado para página de login se não estiver autenticado
        return null;
      }
      return user;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return null;
    }
  }

  // Função para buscar perfil do usuário com suas permissões
  static async getUserProfileWithRoles() {
    try {
      const { data: { user }, error: authError } = await AuthModel.supabase.auth.getUser();
      if (authError || !user) {
        console.error("Usuário não autenticado:", authError);
        throw new Error("Usuário não autenticado");
      }
      
      const profileData = await AuthModel.getCurrentUserProfile();
      console.log("Perfil do usuário:", profileData);
      return profileData;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw error;
    }
  }
  
  // Função para verificar se o usuário é administrador
  static async isUserAdmin() {
    try {
      const { data: { user }, error: authError } = await AuthModel.supabase.auth.getUser();
      if (authError || !user) {
        console.error("Erro ao verificar usuário:", authError);
        return false;
      }
      
      const isAdmin = await AuthModel.checkIsUserAdmin();
      return isAdmin;
    } catch (error) {
      console.error('Erro ao verificar se usuário é admin:', error);
      return false;
    }
  }
}
