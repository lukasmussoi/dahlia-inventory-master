
/**
 * Controlador principal para operações de acerto de maletas
 * @file Este arquivo exporta funcionalidades relacionadas aos acertos de maletas
 * @relacionamento Integra controladores específicos de operações, listagem e detalhes
 */

import { AcertoListController } from "./acertoListController";
import { AcertoOperationsController } from "./acertoOperationsController";
import { AcertoDetailsController } from "./acertoDetailsController";
import { AcertoReportController } from "./acertoReportController";
import { formatCurrency } from "@/lib/utils";

export class AcertoMaletaController {
  // Operações de listagem
  static async getAllAcertos(filters?: any) {
    return AcertoListController.getAllAcertos(filters);
  }

  static async getAcertosBySuitcase(suitcaseId: string) {
    return AcertoListController.getAcertosBySuitcase(suitcaseId);
  }

  // Operações de criação e gerenciamento
  static async createAcerto(data: any) {
    return AcertoOperationsController.createAcerto(data);
  }

  static async deleteAcerto(acertoId: string) {
    return AcertoOperationsController.deleteAcerto(acertoId);
  }

  static async updateAcertoStatus(acertoId: string, newStatus: 'pendente' | 'concluido') {
    return AcertoOperationsController.updateAcertoStatus(acertoId, newStatus);
  }

  // Operações de detalhes
  static async getAcertoById(acertoId: string) {
    return AcertoDetailsController.getAcertoById(acertoId);
  }

  static async getAcertoDetails(acertoId: string) {
    return AcertoDetailsController.getAcertoById(acertoId);
  }

  // Operações de relatórios
  static async generateReceiptPDF(acertoId: string) {
    return AcertoReportController.generateReceiptPDF(acertoId);
  }

  // Utilitários
  static formatCurrency(value?: number) {
    return formatCurrency(value || 0);
  }
}

// Exportar a instância do controlador para uso em importações nomeadas
export const acertoMaletaController = AcertoMaletaController;

// Exportar por padrão para uso em importações padrão
export default AcertoMaletaController;
