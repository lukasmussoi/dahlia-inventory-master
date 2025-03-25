
/**
 * Controlador Combinado de Acertos de Maleta
 * @file Este arquivo exporta todas as funcionalidades relacionadas aos acertos de maleta
 * para manter uma interface consistente para os componentes que utilizam o controlador
 */
import { AcertoListController } from './acertoListController';
import { AcertoDetailsController } from './acertoDetailsController';
import { AcertoOperationsController } from './acertoOperationsController';
import { AcertoReportController } from './acertoReportController';
import { AcertoAnalyticsController } from './acertoAnalyticsController';
import { AcertoFormattingUtils } from './acertoFormattingUtils';

// Exportar um controlador combinado com todas as funcionalidades
export const acertoMaletaController = {
  // AcertoListController - Listagem e filtragem
  getAllAcertos: AcertoListController.getAllAcertos,
  getAcertosBySuitcase: AcertoListController.getAcertosBySuitcase,
  
  // AcertoDetailsController - Detalhes e busca de um acerto específico
  getAcertoById: AcertoDetailsController.getAcertoById,
  
  // AcertoOperationsController - Criar, atualizar, excluir
  createAcerto: AcertoOperationsController.createAcerto,
  deleteAcerto: AcertoOperationsController.deleteAcerto,
  updateAcertoStatus: AcertoOperationsController.updateAcertoStatus,
  
  // AcertoReportController - Geração de relatórios
  generateReceiptPDF: AcertoReportController.generateReceiptPDF,
  
  // AcertoAnalyticsController - Análises e estatísticas
  getItemSalesFrequency: AcertoAnalyticsController.getItemSalesFrequency,
  getPopularItems: AcertoAnalyticsController.getPopularItems,
  
  // Utilidades de formatação
  formatCurrency: AcertoFormattingUtils.formatCurrency
};

// Exportar funções individuais para manter compatibilidade
export { 
  AcertoListController,
  AcertoDetailsController,
  AcertoOperationsController,
  AcertoReportController,
  AcertoAnalyticsController,
  AcertoFormattingUtils
};

// Export com primeira letra maiúscula para manter compatibilidade
export const AcertoMaletaController = acertoMaletaController;

// Export default para casos onde é importado via import default
export default acertoMaletaController;
