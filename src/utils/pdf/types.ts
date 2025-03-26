
/**
 * Interface para opções de geração de PDF de etiquetas
 */
export interface GeneratePdfLabelOptions {
  items: any[];
  copies: number;
  multiplyByStock: boolean;
  selectedModeloId: string;
}
