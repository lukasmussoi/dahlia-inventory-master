
import { jsPDF } from "jspdf";
import { generateBarcode } from "./barcodeUtils";

interface GeneratePdfLabelOptions {
  item: any;
  copies: number;
  startRow: number;
  startColumn: number;
  multiplyByStock: boolean;
}

export async function generatePdfLabel(options: GeneratePdfLabelOptions): Promise<string> {
  const { item, copies, multiplyByStock, startRow, startColumn } = options;
  const totalCopies = multiplyByStock ? copies * item.quantity : copies;

  // Criar novo documento PDF
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Configurações da etiqueta
  const labelWidth = 80;  // largura em mm
  const labelHeight = 8;  // altura em mm (ajustado para 8mm conforme solicitado)
  const marginLeft = 10;   // margem esquerda em mm
  const marginTop = 10;    // margem superior em mm
  const spacing = 5;       // espaçamento entre etiquetas em mm

  // Calcular quantas etiquetas cabem por página
  const labelsPerRow = Math.floor((doc.internal.pageSize.width - 2 * marginLeft) / (labelWidth + spacing));
  const labelsPerColumn = Math.floor((doc.internal.pageSize.height - 2 * marginTop) / (labelHeight + spacing));

  let currentRow = startRow - 1;
  let currentColumn = startColumn - 1;
  let currentPage = 0;

  // Gerar código de barras uma vez para reutilizar
  const barcodeData = await generateBarcode(item.barcode || item.sku);

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

    // Adicionar nome do produto à esquerda da etiqueta
    doc.setFontSize(7); // Tamanho 7 para o nome conforme solicitado
    doc.setFont("helvetica", "normal");
    doc.text(item.name, x + 2, y + 4); // Posicionado à esquerda com pequena margem

    // Adicionar código de barras ao centro
    const barcodeWidth = 40; // Largura reduzida do código de barras
    const barcodeHeight = 6; // Altura reduzida do código de barras
    doc.addImage(barcodeData, "PNG", x + 20, y + 1, barcodeWidth, barcodeHeight);

    // Adicionar preço à direita alinhado com o código de barras
    doc.setFontSize(10); // Tamanho 10 para o preço conforme solicitado
    doc.setFont("helvetica", "bold");
    const priceText = `R$ ${item.price.toFixed(2)}`;
    doc.text(priceText, x + labelWidth - 5, y + 4, { align: 'right' });

    currentRow++;
  }

  // Gerar URL do arquivo temporário
  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);
}
