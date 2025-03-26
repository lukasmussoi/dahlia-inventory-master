
/**
 * Utilitários para Manipulação de PDFs
 * @file Este arquivo contém funções auxiliares para manipulação de PDFs na aplicação
 * @relacionamento Utilizado pelos controladores que geram PDFs
 */

/**
 * Abre um PDF em uma nova aba do navegador
 * @param pdfUrl URL do blob do PDF ou URL remota
 * @returns boolean indicando sucesso
 */
export const openPdfInNewTab = (pdfUrl: string): boolean => {
  try {
    if (!pdfUrl) {
      console.error("URL do PDF não fornecida");
      return false;
    }
    
    console.log("Abrindo PDF em nova aba:", pdfUrl);
    
    // Abrir em uma nova aba
    const newWindow = window.open(pdfUrl, '_blank');
    
    // Verificar se a abertura foi bloqueada pelo navegador
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.warn("A abertura da nova aba foi bloqueada pelo navegador. Tentando abordagem alternativa...");
      
      // Tentar abordagem alternativa
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao abrir PDF em nova aba:", error);
    return false;
  }
};
