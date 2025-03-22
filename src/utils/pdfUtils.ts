
import { jsPDF } from "jspdf";
import { generateBarcode } from "./barcodeUtils";
import { toast } from "sonner";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import type { CampoEtiqueta } from "@/types/etiqueta";
import { generateEtiquetaPDF } from "./etiquetaGenerator";

interface GeneratePdfLabelOptions {
  item: any;
  copies: number;
  startRow: number;
  startColumn: number;
  multiplyByStock: boolean;
  selectedModeloId?: string;
}

export async function generatePdfLabel(options: GeneratePdfLabelOptions): Promise<string> {
  try {
    const { item, copies, multiplyByStock, startRow, startColumn, selectedModeloId } = options;
    
    if (!item) {
      throw new Error("Item não fornecido para gerar etiqueta");
    }
    
    // Calcular número total de cópias
    const totalCopies = multiplyByStock ? copies * (item.quantity || 1) : copies;
    console.log("Gerando etiquetas:", { 
      item: item.name, 
      copies, 
      totalCopies, 
      multiplyByStock, 
      selectedModeloId 
    });

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
    
    // Validar dimensões da página personalizada
    if (modeloCustom.formatoPagina === "Personalizado") {
      console.log("Verificando dimensões personalizadas:", {
        larguraPagina: modeloCustom.larguraPagina,
        alturaPagina: modeloCustom.alturaPagina
      });
      
      // Se as dimensões não estiverem definidas, definir um padrão
      if (!modeloCustom.larguraPagina || !modeloCustom.alturaPagina) {
        console.warn("Dimensões personalizadas não definidas. Usando valores padrão.");
        modeloCustom.larguraPagina = 210; // A4 width em mm
        modeloCustom.alturaPagina = 297; // A4 height em mm
      }
      
      // Validar valores positivos
      if (modeloCustom.larguraPagina <= 0 || modeloCustom.alturaPagina <= 0) {
        console.error("Dimensões de página inválidas:", { 
          largura: modeloCustom.larguraPagina, 
          altura: modeloCustom.alturaPagina 
        });
        throw new Error("Dimensões de página personalizadas inválidas. Os valores devem ser maiores que zero.");
      }
      
      // Validar se a etiqueta cabe na página
      const areaUtilLargura = modeloCustom.larguraPagina - modeloCustom.margemEsquerda - modeloCustom.margemDireita;
      if (modeloCustom.largura > areaUtilLargura) {
        console.error("Etiqueta maior que área útil:", {
          larguraEtiqueta: modeloCustom.largura,
          areaUtilLargura
        });
        
        const sugestaoLarguraEtiqueta = Math.floor(areaUtilLargura * 0.9);
        throw new Error(
          `A largura da etiqueta (${modeloCustom.largura}mm) é maior que a área útil disponível (${areaUtilLargura}mm). ` +
          `Sugestão: Reduza a largura da etiqueta para ${sugestaoLarguraEtiqueta}mm ou ` +
          `aumente a largura da página/reduza as margens.`
        );
      }
      
      const areaUtilAltura = modeloCustom.alturaPagina - modeloCustom.margemSuperior - modeloCustom.margemInferior;
      if (modeloCustom.altura > areaUtilAltura) {
        console.error("Etiqueta maior que área útil:", {
          alturaEtiqueta: modeloCustom.altura,
          areaUtilAltura
        });
        
        const sugestaoAlturaEtiqueta = Math.floor(areaUtilAltura * 0.9);
        throw new Error(
          `A altura da etiqueta (${modeloCustom.altura}mm) é maior que a área útil disponível (${areaUtilAltura}mm). ` +
          `Sugestão: Reduza a altura da etiqueta para ${sugestaoAlturaEtiqueta}mm ou ` +
          `aumente a altura da página/reduza as margens.`
        );
      }
    }
    
    // Validar se há campos definidos
    if (!modeloCustom.campos || modeloCustom.campos.length === 0) {
      console.error("Modelo sem campos definidos");
      throw new Error("O modelo de etiqueta não possui elementos para impressão. Adicione elementos ao modelo.");
    }
    
    try {
      console.log("Iniciando geração de PDF com modelo personalizado");
      return await generateEtiquetaPDF(
        modeloCustom,
        [item], // Passamos o item como um array
        {
          startRow,
          startColumn,
          copias: totalCopies
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
