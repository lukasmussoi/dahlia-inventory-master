
import { jsPDF } from "jspdf";
import { generateBarcode } from "./barcodeUtils";
import { toast } from "sonner";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import type { CampoEtiqueta } from "@/types/etiqueta";
import { generateEtiquetaPDF } from "./etiquetaGenerator";
import { validateDocumentSize } from "@/lib/utils";

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

    // Se um modelo personalizado foi selecionado, usamos a nova implementação
    if (selectedModeloId) {
      console.log("Usando modelo personalizado ID:", selectedModeloId);
      const modeloCustom = await EtiquetaCustomModel.getById(selectedModeloId);
      
      if (modeloCustom) {
        console.log("Modelo personalizado encontrado:", modeloCustom);
        console.log("Campos do modelo:", modeloCustom.campos);
        
        // Validar dimensões da página personalizada
        if (modeloCustom.formatoPagina === "Personalizado") {
          console.log("Verificando dimensões personalizadas:", {
            larguraPagina: modeloCustom.larguraPagina,
            alturaPagina: modeloCustom.alturaPagina,
            orientacao: modeloCustom.orientacao
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
          
          // Ajustar dimensões com base na orientação
          let areaUtilLargura = modeloCustom.larguraPagina;
          let areaUtilAltura = modeloCustom.alturaPagina;
          
          if (modeloCustom.orientacao === "paisagem" && areaUtilAltura > areaUtilLargura) {
            // Trocar as dimensões para paisagem
            [areaUtilLargura, areaUtilAltura] = [areaUtilAltura, areaUtilLargura];
          }
          
          // Subtrair as margens para obter a área útil
          areaUtilLargura -= (modeloCustom.margemEsquerda + modeloCustom.margemDireita);
          areaUtilAltura -= (modeloCustom.margemSuperior + modeloCustom.margemInferior);
          
          // Validar se a etiqueta cabe na página
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
      } else {
        console.warn("Modelo personalizado não encontrado, ID:", selectedModeloId);
        throw new Error("Modelo de etiqueta não encontrado. Por favor, selecione outro modelo.");
      }
    }

    // Configurações padrão da etiqueta (caso não tenha modelo personalizado)
    console.log("Usando configurações padrão para etiquetas");
    let labelWidth = 90;  // largura em mm (ajustado para 90mm)
    let labelHeight = 10;  // altura em mm (ajustado para 10mm)
    let marginLeft = 0;   // margem esquerda em mm
    let marginTop = 0;    // margem superior em mm
    let spacing = 0;       // espaçamento entre etiquetas em mm
    let orientation = "landscape"; // orientação paisagem
    let format = [90, 10]; // formato personalizado
    let campos: CampoEtiqueta[] = [
      { tipo: 'nome', x: 2, y: 4, largura: 40, altura: 5, tamanhoFonte: 7 },
      { tipo: 'codigo', x: 2, y: 1, largura: 40, altura: 3, tamanhoFonte: 6 },
      { tipo: 'preco', x: 70, y: 5, largura: 20, altura: 5, tamanhoFonte: 8 }
    ];

    // Criar novo documento PDF com as configurações adequadas
    const doc = new jsPDF({
      orientation: orientation as "portrait" | "landscape",
      unit: "mm",
      format: format,
    });

    // Configurar metadados do PDF
    doc.setProperties({
      title: "Dalia Manager - Etiquetas",
      author: "Dalia Manager",
      subject: "Etiquetas",
      keywords: "etiquetas, PDF, dalia manager",
      creator: "Dalia Manager"
    });

    // Calcular quantas etiquetas cabem por página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    console.log("Dimensões da página:", pageWidth, "x", pageHeight, "mm");
    
    // Verificar se as dimensões fazem sentido para uma página
    if (pageWidth <= 0 || pageHeight <= 0) {
      console.error("Dimensões da página inválidas:", pageWidth, "x", pageHeight);
      throw new Error("Dimensões da página inválidas. Por favor, verifique as configurações do formato da página.");
    }
    
    // Verificar se a etiqueta cabe na página
    if (labelWidth > (pageWidth - 2 * marginLeft)) {
      console.error("Largura da etiqueta maior que a largura útil da página");
      throw new Error("A largura da etiqueta é maior que a largura útil da página. Por favor, ajuste as dimensões.");
    }
    
    // Para uma etiqueta única, definimos apenas 1 por página
    const labelsPerRow = 1;
    const labelsPerColumn = 1;

    console.log("Configurações de etiqueta:", { 
      labelWidth, labelHeight, marginLeft, marginTop, spacing,
      labelsPerRow, labelsPerColumn, totalCopies, pageWidth, pageHeight
    });

    // Gerar código de barras uma vez para reutilizar
    const barcodeText = item.barcode || item.sku || "0000000000";
    const barcodeData = await generateBarcode(barcodeText);

    let currentPage = 0;

    // Para cada cópia, criar uma nova página
    for (let i = 0; i < totalCopies; i++) {
      if (i > 0) {
        doc.addPage([90, 10], "landscape");
        currentPage++;
      }

      // Posição fixa para etiqueta única por página
      const x = marginLeft;
      const y = marginTop;

      // Buscar configurações dos campos
      const campoNome = campos.find(c => c.tipo === 'nome') || { tipo: 'nome', x: 2, y: 4, largura: 40, altura: 5, tamanhoFonte: 7 };
      const campoCodigo = campos.find(c => c.tipo === 'codigo') || { tipo: 'codigo', x: 2, y: 1, largura: 40, altura: 3, tamanhoFonte: 6 };
      const campoPreco = campos.find(c => c.tipo === 'preco') || { tipo: 'preco', x: 70, y: 5, largura: 20, altura: 5, tamanhoFonte: 8 };

      // Adicionar nome do produto
      try {
        doc.setFontSize(campoNome.tamanhoFonte);
        doc.setFont("helvetica", "normal");
        const nomeProduto = item.name || "Sem nome";
        doc.text(nomeProduto, x + campoNome.x, y + campoNome.y);
      } catch (error) {
        console.error("Erro ao adicionar nome do produto:", error);
      }

      // Adicionar código de barras
      try {
        doc.addImage(barcodeData, "PNG", x + campoCodigo.x, y + campoCodigo.y, campoCodigo.largura, campoCodigo.altura);
      } catch (error) {
        console.error("Erro ao adicionar código de barras:", error);
      }

      // Adicionar preço
      try {
        doc.setFontSize(campoPreco.tamanhoFonte);
        doc.setFont("helvetica", "bold");
        const price = typeof item.price === 'number' ? item.price.toFixed(2) : '0.00';
        const priceText = `R$ ${price}`;
        doc.text(priceText, x + campoPreco.x, y + campoPreco.y, { align: 'right' });
      } catch (error) {
        console.error("Erro ao adicionar preço:", error);
      }
    }

    // Gerar URL do arquivo temporário
    const pdfBlob = doc.output("blob");
    return URL.createObjectURL(pdfBlob);
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
