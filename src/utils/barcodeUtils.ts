
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
      displayValue: true,
      fontSize: 6, // Fonte menor para o valor do código
      margin: 0, // Sem margem
      textAlign: "center",
      background: "#ffffff",
      textMargin: 1 // Margem mínima entre o texto e o código
    });

    // Converter o canvas para uma URL de dados PNG
    const dataUrl = canvas.toDataURL('image/png');
    resolve(dataUrl);
  });
}

/**
 * Processa uma lista de códigos de barras escaneados para uso no acerto da maleta
 * @param scannedCodes Lista de códigos escaneados
 * @returns Array de códigos únicos e processados
 */
export function processScannedCodes(scannedCodes: string[]): string[] {
  // Remover códigos duplicados
  const uniqueCodes = [...new Set(scannedCodes)];
  
  // Remover espaços em branco e caracteres não alfanuméricos
  return uniqueCodes.map(code => {
    return code.trim().replace(/[^a-zA-Z0-9]/g, '');
  }).filter(code => code.length > 0);
}

/**
 * Compara listas de códigos para identificar itens vendidos e retornados
 * @param originalItems Lista de todos os itens originais
 * @param scannedCodes Lista de códigos escaneados (retornados)
 * @returns Objeto com arrays de itens vendidos e retornados
 */
export function compareItemsWithScannedCodes(originalItems: any[], scannedCodes: string[]) {
  // Converter para Set para busca mais rápida
  const scannedCodesSet = new Set(scannedCodes);
  
  // Identificar itens retornados (encontrados no scan)
  const returnedItems = originalItems.filter(item => {
    const itemCode = item.product?.barcode || item.product?.sku;
    return itemCode && scannedCodesSet.has(itemCode);
  });
  
  // Identificar itens vendidos (não encontrados no scan)
  const soldItems = originalItems.filter(item => {
    const itemCode = item.product?.barcode || item.product?.sku;
    return itemCode && !scannedCodesSet.has(itemCode);
  });
  
  return {
    returnedItems,
    soldItems
  };
}
