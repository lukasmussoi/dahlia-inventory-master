
/**
 * Utilitários de Formatação para Acertos
 * @file Este arquivo contém funções utilitárias para formatação de dados de acertos.
 */

export class AcertoFormattingUtils {
  /**
   * Formata um valor numérico para o formato de moeda brasileira
   * @param value Valor a ser formatado
   * @returns String formatada no padrão brasileiro
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  }
}
