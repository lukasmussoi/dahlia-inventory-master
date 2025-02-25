
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
  const { item, copies, multiplyByStock } = options;
  const totalCopies = multiplyByStock ? copies * item.quantity : copies;

  // Criar novo documento PDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Configurar fonte e tamanho
  doc.setFontSize(10);

  // Gerar código de barras
  const barcodeData = await generateBarcode(item.barcode || item.sku);

  // Adicionar elementos à etiqueta
  doc.addImage(barcodeData, "PNG", 10, 10, 50, 15);
  doc.text(item.name, 10, 30);
  doc.text(`R$ ${item.price.toFixed(2)}`, 10, 40);

  // Gerar URL do arquivo temporário
  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);
}
