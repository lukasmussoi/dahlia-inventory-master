
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
      
      // Se a opção "Multiplicar por estoque" estiver ativada, ajustar as cópias para cada item
      // baseado na quantidade em estoque
      let itemsToProcess = [];
      
      if (multiplyByStock) {
        console.log("Opção 'Multiplicar por estoque' ativada - gerando etiquetas baseadas na quantidade em estoque");
        
        // Para cada item, criar cópias baseadas na quantidade em estoque
        for (const item of items) {
          const stockQuantity = item.quantity || 0;
          
          if (stockQuantity > 0) {
            console.log(`Item ${item.name || item.id} tem ${stockQuantity} unidades em estoque`);
            
            // Adicionar o item à lista de processamento com sua quantidade de estoque
            itemsToProcess.push({
              ...item,
              _copiesForStock: stockQuantity
            });
          } else {
            console.warn(`Item ${item.name || item.id} tem estoque zero, gerando apenas uma etiqueta`);
            
            // Mesmo com estoque zero, adicionamos uma cópia para garantir pelo menos uma etiqueta
            itemsToProcess.push({
              ...item,
              _copiesForStock: 1
            });
          }
        }
        
        // Calcular o total de etiquetas que serão geradas
        const totalLabels = itemsToProcess.reduce((total, item) => total + item._copiesForStock, 0);
        console.log(`Total de etiquetas a serem geradas (multiplicado por estoque): ${totalLabels}`);
      } else {
        // Modo normal, usar o número de cópias definido pelo usuário
        itemsToProcess = items;
      }
      
      return await generatePrintablePDF(
        modeloCustom,
        itemsToProcess, // Passamos os itens processados (com informação de quantidade)
        {
          copias: copies,
          multiplicarPorEstoque: multiplyByStock // Enviar flag para o gerador
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
