
import { jsPDF } from "jspdf";
import { generateBarcode } from "./barcodeUtils";
import { toast } from "sonner";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import type { CampoEtiqueta } from "@/types/etiqueta";

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
    
    const totalCopies = multiplyByStock ? copies * (item.quantity || 1) : copies;

    // Configurações padrão da etiqueta
    let labelWidth = 80;  // largura em mm
    let labelHeight = 8;  // altura em mm (ajustado para 8mm conforme solicitado)
    let marginLeft = 10;   // margem esquerda em mm
    let marginTop = 10;    // margem superior em mm
    let spacing = 5;       // espaçamento entre etiquetas em mm
    let orientation = "landscape";
    let format = "a4";
    let campos: CampoEtiqueta[] = [
      { tipo: 'nome', x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7 },
      { tipo: 'codigo', x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8 },
      { tipo: 'preco', x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10 }
    ];

    // Se um modelo personalizado foi selecionado, carrega suas configurações
    if (selectedModeloId) {
      console.log("Usando modelo personalizado ID:", selectedModeloId);
      const modeloCustom = await EtiquetaCustomModel.getById(selectedModeloId);
      
      if (modeloCustom) {
        console.log("Modelo personalizado encontrado:", modeloCustom);
        
        labelWidth = modeloCustom.largura;
        labelHeight = modeloCustom.altura;
        marginLeft = modeloCustom.margemEsquerda;
        marginTop = modeloCustom.margemSuperior;
        spacing = Math.max(modeloCustom.espacamentoHorizontal, modeloCustom.espacamentoVertical);
        orientation = modeloCustom.orientacao === "retrato" ? "portrait" : "landscape";
        format = modeloCustom.formatoPagina.toLowerCase();
        
        // Se o formato for personalizado, usar as dimensões especificadas
        let pageWidth, pageHeight;
        if (modeloCustom.formatoPagina === "Personalizado" && modeloCustom.larguraPagina && modeloCustom.alturaPagina) {
          pageWidth = modeloCustom.larguraPagina;
          pageHeight = modeloCustom.alturaPagina;
          
          // Usar formato personalizado
          format = [pageWidth, pageHeight];
        }
        
        // Usar os campos personalizados se existirem
        if (modeloCustom.campos && modeloCustom.campos.length > 0) {
          campos = modeloCustom.campos;
          console.log("Usando campos personalizados:", campos);
        }
      } else {
        console.warn("Modelo personalizado não encontrado, usando configurações padrão");
      }
    }

    // Criar novo documento PDF com as configurações adequadas
    const doc = new jsPDF({
      orientation: orientation as any,
      unit: "mm",
      format: format,
    });

    // Calcular quantas etiquetas cabem por página
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    console.log("Dimensões da página:", pageWidth, "x", pageHeight, "mm");
    
    const labelsPerRow = Math.floor((pageWidth - 2 * marginLeft) / (labelWidth + spacing));
    const labelsPerColumn = Math.floor((pageHeight - 2 * marginTop) / (labelHeight + spacing));

    console.log("Configurações de etiqueta:", { 
      labelWidth, labelHeight, marginLeft, marginTop, spacing,
      labelsPerRow, labelsPerColumn, totalCopies, pageWidth, pageHeight
    });

    // Verificar se os valores calculados são válidos
    if (isNaN(labelsPerRow) || labelsPerRow <= 0) {
      console.error("labelsPerRow inválido:", labelsPerRow);
      throw new Error("Configuração inválida: não é possível calcular a quantidade de etiquetas por linha");
    }
    
    if (isNaN(labelsPerColumn) || labelsPerColumn <= 0) {
      console.error("labelsPerColumn inválido:", labelsPerColumn);
      throw new Error("Configuração inválida: não é possível calcular a quantidade de etiquetas por coluna");
    }

    let currentRow = startRow - 1;
    let currentColumn = startColumn - 1;
    let currentPage = 0;

    // Garantir valores válidos
    if (currentRow < 0) currentRow = 0;
    if (currentColumn < 0) currentColumn = 0;

    // Gerar código de barras uma vez para reutilizar
    const barcodeText = item.barcode || item.sku || "0000000000";
    const barcodeData = await generateBarcode(barcodeText);

    for (let i = 0; i < totalCopies; i++) {
      // Verificar se precisa de nova página
      if (currentRow >= labelsPerColumn) {
        currentRow = 0;
        currentColumn++;
        
        if (currentColumn >= labelsPerRow) {
          currentColumn = 0;
          doc.addPage();
          currentPage++;
        }
      }

      // Calcular posição da etiqueta
      const x = marginLeft + currentColumn * (labelWidth + spacing);
      const y = marginTop + currentRow * (labelHeight + spacing);

      // Buscar configurações dos campos
      const campoNome = campos.find(c => c.tipo === 'nome') || { x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7 };
      const campoCodigo = campos.find(c => c.tipo === 'codigo') || { x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8 };
      const campoPreco = campos.find(c => c.tipo === 'preco') || { x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10 };

      // Adicionar nome do produto - usar try/catch para cada operação
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
        doc.text(priceText, x + campoPreco.x, y + campoPreco.y);
      } catch (error) {
        console.error("Erro ao adicionar preço:", error);
      }

      currentRow++;
    }

    // Gerar URL do arquivo temporário
    const pdfBlob = doc.output("blob");
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    toast.error("Erro ao gerar etiquetas. Por favor, tente novamente.");
    throw error;
  }
}
