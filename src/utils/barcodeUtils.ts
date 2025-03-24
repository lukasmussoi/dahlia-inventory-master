
import JsBarcode from 'jsbarcode';

/**
 * Gera uma imagem de código de barras a partir de um texto
 * @param text Texto para gerar o código de barras
 * @returns Promise<string> URL da imagem do código de barras em formato PNG
 */
export async function generateBarcode(text: string): Promise<string> {
  return new Promise((resolve) => {
    // Criar um elemento canvas temporário
    const canvas = document.createElement('canvas');
    
    // Gerar o código de barras no canvas
    JsBarcode(canvas, text, {
      format: "CODE128",
      width: 1, // Largura mais fina das barras
      height: 20, // Altura menor para caber na etiqueta de 8mm
      displayValue: false, // Não mostrar o valor numérico
      fontSize: 0, // Tamanho de fonte zero para garantir que não seja exibido
      margin: 0, // Sem margem
      textMargin: 0, // Sem margem para texto
      background: "#ffffff",
      lineColor: "#000000"
    });

    // Converter o canvas para uma URL de dados PNG
    const dataUrl = canvas.toDataURL('image/png');
    resolve(dataUrl);
  });
}
