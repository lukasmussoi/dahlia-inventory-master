
/**
 * Tipos e interfaces para geração de PDF de etiquetas
 */

export interface GeneratePdfLabelOptions {
  items: any[]; // Modificado: Agora é um array de itens
  copies: number;
  multiplyByStock: boolean;
  selectedModeloId?: string;
}

export interface PdfGenerationResult {
  url: string;
  pageCount: number;
  labelCount: number;
}

export interface ReceiptPdfOptions {
  acertoId: string;
  title: string;
  subtitle?: string;
  includeImages?: boolean;
}

export interface AcertoReceiptData {
  id: string;
  settlement_date: string;
  next_settlement_date?: string;
  maleta?: {
    code: string;
    city?: string;
    neighborhood?: string;
  };
  revendedora?: {
    name: string;
    commission_rate?: number;
  };
  total_sales: number;
  commission_amount: number;
  items_vendidos?: Array<{
    id: string;
    product?: {
      name: string;
      sku: string;
      price: number;
      photo_url?: string;
    };
    customer_name?: string;
    price: number;
  }>;
}

/**
 * Função para extrair e baixar um PDF a partir de uma URL de dados
 */
export function downloadPdfFromDataUrl(dataUrl: string, fileName: string = 'documento.pdf'): void {
  // Verificar se é uma URL de dados de PDF válida
  if (!dataUrl || !dataUrl.startsWith('data:application/pdf;base64,')) {
    console.error('URL de dados inválida para PDF');
    return;
  }

  try {
    // Criar um elemento de link para download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.target = '_blank';
    
    // Adicionar ao documento, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Erro ao baixar PDF:', error);
  }
}

/**
 * Função para abrir um PDF a partir de uma URL de dados em uma nova aba
 */
export function openPdfInNewTab(dataUrl: string): void {
  // Verificar se é uma URL de dados de PDF válida
  if (!dataUrl || !dataUrl.startsWith('data:application/pdf;base64,')) {
    console.error('URL de dados inválida para PDF');
    return;
  }

  try {
    // Criar uma URL Blob para abrir em nova aba
    const byteCharacters = atob(dataUrl.split(',')[1]);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
    
    const byteArray = new Uint8Array(byteArrays);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Abrir em nova aba
    window.open(blobUrl, '_blank');
  } catch (error) {
    console.error('Erro ao abrir PDF em nova aba:', error);
  }
}
