
import { EtiquetaCustomModel, ModeloEtiqueta, CampoEtiqueta } from "@/models/etiquetaCustomModel";
import { toast } from "sonner";
import { AuthModel } from "@/models/authModel";

export class EtiquetaCustomController {
  // Listar todos os modelos de etiquetas
  static async listarModelos() {
    try {
      console.log("Iniciando carregamento de modelos de etiquetas...");
      const modelos = await EtiquetaCustomModel.getAllModelos();
      console.log("Modelos carregados com sucesso:", modelos.length);
      return modelos;
    } catch (error) {
      console.error('Erro ao listar modelos de etiquetas:', error);
      toast.error('Erro ao carregar modelos de etiquetas');
      return []; // Retornar array vazio para evitar erros no componente
    }
  }

  // Obter modelo específico
  static async obterModelo(id: string) {
    try {
      const modelo = await EtiquetaCustomModel.getModeloById(id);
      return modelo;
    } catch (error) {
      console.error('Erro ao obter modelo de etiqueta:', error);
      toast.error('Erro ao carregar modelo de etiqueta');
      throw error;
    }
  }

  // Salvar novo modelo
  static async salvarModelo(modelo: Omit<ModeloEtiqueta, 'id' | 'criado_em' | 'atualizado_em' | 'criado_por'>) {
    try {
      // Obter usuário atual
      const user = await AuthModel.getCurrentUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      console.log("Salvando modelo com usuário:", user.id);
      
      const novoModelo = await EtiquetaCustomModel.createModelo({
        ...modelo,
        criado_por: user.id
      });
      
      toast.success('Modelo de etiqueta salvo com sucesso');
      return novoModelo;
    } catch (error) {
      console.error('Erro ao salvar modelo de etiqueta:', error);
      toast.error('Erro ao salvar modelo de etiqueta');
      throw error;
    }
  }

  // Atualizar modelo existente
  static async atualizarModelo(id: string, modelo: Partial<ModeloEtiqueta>) {
    try {
      const modeloAtualizado = await EtiquetaCustomModel.updateModelo(id, modelo);
      toast.success('Modelo de etiqueta atualizado com sucesso');
      return modeloAtualizado;
    } catch (error) {
      console.error('Erro ao atualizar modelo de etiqueta:', error);
      toast.error('Erro ao atualizar modelo de etiqueta');
      throw error;
    }
  }

  // Excluir modelo
  static async excluirModelo(id: string) {
    try {
      await EtiquetaCustomModel.deleteModelo(id);
      toast.success('Modelo de etiqueta excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir modelo de etiqueta:', error);
      toast.error('Erro ao excluir modelo de etiqueta');
      throw error;
    }
  }

  // Clonar modelo
  static async clonarModelo(id: string, novaDescricao: string) {
    try {
      const modeloClonado = await EtiquetaCustomModel.clonarModelo(id, novaDescricao);
      toast.success('Modelo de etiqueta clonado com sucesso');
      return modeloClonado;
    } catch (error) {
      console.error('Erro ao clonar modelo de etiqueta:', error);
      toast.error('Erro ao clonar modelo de etiqueta');
      throw error;
    }
  }

  // Obter campos disponíveis para um tipo de etiqueta
  static getCamposDisponiveis(tipo: string) {
    return EtiquetaCustomModel.getCamposDisponiveis(tipo);
  }

  // Gerar um campo novo para o modelo
  static gerarCampoNovo(tipo: string, valorPadrao: string = ''): CampoEtiqueta {
    return {
      id: crypto.randomUUID(),
      tipo: tipo as any,
      valor: valorPadrao,
      x: 10,
      y: 10,
      largura: 100,
      altura: 30,
      fonte: 'helvetica',
      tamanhoFonte: 12
    };
  }
}
