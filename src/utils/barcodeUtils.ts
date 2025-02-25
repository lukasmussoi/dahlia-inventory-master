
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
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 10,
      margin: 2,
      textAlign: "center",
      background: "#ffffff",
    });

    // Converter o canvas para uma URL de dados PNG
    const dataUrl = canvas.toDataURL('image/png');
    resolve(dataUrl);
  });
}
