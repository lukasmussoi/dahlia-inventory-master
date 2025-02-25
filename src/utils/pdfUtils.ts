
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
  const labelWidth = 100;  // largura em mm
  const labelHeight = 30;  // altura em mm
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

    // Desenhar borda da etiqueta (opcional)
    // doc.rect(x, y, labelWidth, labelHeight);

    // Adicionar nome do produto centralizado no topo
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const nameWidth = doc.getStringUnitWidth(item.name) * 10 / doc.internal.scaleFactor;
    const nameX = x + (labelWidth - nameWidth) / 2;
    doc.text(item.name, nameX, y + 5);

    // Adicionar código de barras centralizado
    const barcodeWidth = 80;
    const barcodeX = x + (labelWidth - barcodeWidth) / 2;
    doc.addImage(barcodeData, "PNG", barcodeX, y + 7, barcodeWidth, 15);

    // Adicionar preço alinhado à direita
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const priceText = `R$ ${item.price.toFixed(2)}`;
    const priceWidth = doc.getStringUnitWidth(priceText) * 12 / doc.internal.scaleFactor;
    const priceX = x + labelWidth - 5;  // 5mm da margem direita
    doc.text(priceText, priceX, y + 28, { align: 'right' });

    currentRow++;
  }

  // Gerar URL do arquivo temporário
  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);
}
