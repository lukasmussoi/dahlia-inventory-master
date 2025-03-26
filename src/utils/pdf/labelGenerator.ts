
/**
 * Gerador de etiquetas em PDF
 */
import { toast } from "sonner";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import { generatePrintablePDF } from "@/utils/etiqueta/printGenerator";
import { validateLabelDimensions } from "./validationUtils";
import type { GeneratePdfLabelOptions } from "./types";

/**
 * Gera um PDF com etiquetas baseado nas opções fornecidas
 * 
 * @param options Opções para geração do PDF
 * @returns Uma Promise com a URL do PDF gerado
 */
export async function generatePdfLabel(options: GeneratePdfLabelOptions): Promise<string> {
  try {
    const { items, copies, multiplyByStock, selectedModeloId } = options;
    
    if (!items || items.length === 0) {
      throw new Error("Nenhum item fornecido para gerar etiquetas");
    }
    
    console.log(`Gerando etiquetas para ${items.length} itens, ${copies} cópias por item, multiplicar por estoque: ${multiplyByStock}`);
    
    // Validar se um modelo personalizado foi fornecido
    if (!selectedModeloId) {
      throw new Error("Nenhum modelo de etiqueta selecionado. Por favor, selecione um modelo personalizado.");
    }

    // Buscar e usar o modelo personalizado
    console.log("Usando modelo personalizado ID:", selectedModeloId);
    const modeloCustom = await EtiquetaCustomModel.getById(selectedModeloId);
    
    if (!modeloCustom) {
      console.warn("Modelo personalizado não encontrado, ID:", selectedModeloId);
      throw new Error("Modelo de etiqueta não encontrado. Por favor, selecione outro modelo.");
    }
      
    console.log("Modelo personalizado encontrado:", modeloCustom);
    console.log("Campos do modelo:", modeloCustom.campos);
    
    // Validar dimensões do modelo
    const validationError = validateLabelDimensions(modeloCustom);
    if (validationError) {
      throw new Error(validationError);
    }
    
    try {
      console.log("Iniciando geração de PDF com modelo personalizado");
      return await generatePrintablePDF(
        modeloCustom,
        items, // Aqui passamos o array completo de itens
        {
          copias: copies
        }
      );
    } catch (error) {
      console.error("Erro ao gerar PDF com modelo personalizado:", error);
      
      // Mensagem de erro específica
      if (error instanceof Error) {
        throw new Error(`Erro ao gerar etiquetas personalizadas: ${error.message}`);
      } else {
        throw new Error("Erro ao gerar etiquetas personalizadas. Verifique as configurações do modelo.");
      }
    }
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    
    // Exibir mensagem de erro mais descritiva
    if (error instanceof Error) {
      toast.error(`Erro ao gerar etiquetas: ${error.message}`);
    } else {
      toast.error("Erro ao gerar etiquetas. Por favor, verifique as configurações e tente novamente.");
    }
    
    throw error;
  }
}
