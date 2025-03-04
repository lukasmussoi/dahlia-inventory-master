
import { jsPDF } from "jspdf";
import { CampoEtiqueta, ModeloEtiqueta } from "@/models/etiquetaCustomModel";
import { generateBarcode } from "./barcodeUtils";

interface ItemData {
  [key: string]: any;
}

interface GerarEtiquetasOptions {
  modelo: ModeloEtiqueta;
  itens: ItemData[];
  copias: number;
  iniciarLinha: number;
  iniciarColuna: number;
  multiplicarPorEstoque: boolean;
}

export async function gerarEtiquetasCustomizadas(options: GerarEtiquetasOptions): Promise<string> {
  const { modelo, itens, copias, iniciarLinha, iniciarColuna, multiplicarPorEstoque } = options;
  
  // Criar novo documento PDF
  const orientacao = modelo.orientacao === 'paisagem' ? 'landscape' : 'portrait';
  const doc = new jsPDF({
    orientation: orientacao as any,
    unit: 'mm',
    format: modelo.formatoPagina !== 'personalizado' ? modelo.formatoPagina : undefined,
  });

  // Se for formato personalizado, definir tamanho da página
  if (modelo.formatoPagina === 'personalizado' && modelo.larguraPagina && modelo.alturaPagina) {
    doc.addPage([modelo.larguraPagina, modelo.alturaPagina]);
    // Remover a primeira página (que é criada automaticamente)
    doc.deletePage(1);
  }

  // Configurações da etiqueta
  const largura = modelo.largura;
  const altura = modelo.altura;
  const margemEsquerda = modelo.margemEsquerda;
  const margemSuperior = modelo.margemSuperior;
  const espacamentoHorizontal = modelo.espacamentoHorizontal;
  const espacamentoVertical = modelo.espacamentoVertical;

  // Calcular quantas etiquetas cabem por página
  const larguraPagina = doc.internal.pageSize.width;
  const alturaPagina = doc.internal.pageSize.height;
  
  const etiquetasPorLinha = Math.floor((larguraPagina - margemEsquerda - modelo.margemDireita) / (largura + espacamentoHorizontal));
  const etiquetasPorColuna = Math.floor((alturaPagina - margemSuperior - modelo.margemInferior) / (altura + espacamentoVertical));

  let linha = iniciarLinha - 1;
  let coluna = iniciarColuna - 1;

  // Processar cada item
  for (const item of itens) {
    const totalCopias = multiplicarPorEstoque && item.quantity ? copias * item.quantity : copias;
    
    for (let i = 0; i < totalCopias; i++) {
      // Verificar se precisa avançar para próxima linha/coluna/página
      if (coluna >= etiquetasPorLinha) {
        coluna = 0;
        linha++;
      }
      
      if (linha >= etiquetasPorColuna) {
        linha = 0;
        doc.addPage();
      }

      // Calcular posição da etiqueta
      const x = margemEsquerda + coluna * (largura + espacamentoHorizontal);
      const y = margemSuperior + linha * (altura + espacamentoVertical);

      // Desenhar borda da etiqueta (opcional)
      // doc.rect(x, y, largura, altura, 'S');

      // Aplicar campos conforme o modelo
      await aplicarCampos(doc, x, y, modelo.campos, item);

      coluna++;
    }
  }

  // Gerar URL do PDF
  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);
}

async function aplicarCampos(doc: jsPDF, xBase: number, yBase: number, campos: CampoEtiqueta[], item: ItemData) {
  for (const campo of campos) {
    const x = xBase + campo.x / 10; // Converter de pixels para mm (aproximado)
    const y = yBase + campo.y / 10; // Converter de pixels para mm (aproximado)
    const largura = campo.largura / 10; // Converter de pixels para mm (aproximado)
    const altura = campo.altura / 10; // Converter de pixels para mm (aproximado)

    // Definir fonte e tamanho
    const fonte = campo.fonte || 'helvetica';
    const tamanhoFonte = campo.tamanhoFonte || 12;
    doc.setFont(fonte, campo.negrito ? 'bold' : (campo.italico ? 'italic' : 'normal'));
    doc.setFontSize(tamanhoFonte);

    switch (campo.tipo) {
      case 'texto':
        // Se tiver rótulo, exibir
        if (campo.rotulo) {
          doc.text(`${campo.rotulo}: ${obterValorCampo(item, campo.valor) || ''}`, x, y + tamanhoFonte/6);
        } else {
          doc.text(obterValorCampo(item, campo.valor) || '', x, y + tamanhoFonte/6);
        }
        break;

      case 'preco':
        const moeda = campo.moeda || 'R$';
        const valorFormatado = `${moeda} ${obterValorCampo(item, 'price', 0).toFixed(2)}`;
        
        if (campo.rotulo) {
          doc.text(`${campo.rotulo}: ${valorFormatado}`, x, y + tamanhoFonte/6);
        } else {
          doc.text(valorFormatado, x, y + tamanhoFonte/6);
        }
        break;

      case 'codigoBarras':
        try {
          const codigoValor = obterValorCampo(item, 'barcode') || obterValorCampo(item, 'sku') || '';
          if (codigoValor) {
            const barcodeData = await generateBarcode(codigoValor);
            doc.addImage(barcodeData, 'PNG', x, y, largura, altura);
            
            // Se configurado para mostrar código em texto
            if (campo.mostrarCodigo) {
              const oldFontSize = doc.getFontSize();
              doc.setFontSize(8);
              doc.text(codigoValor, x + largura/2, y + altura + 3, { align: 'center' });
              doc.setFontSize(oldFontSize);
            }
          }
        } catch (e) {
          console.error('Erro ao gerar código de barras:', e);
        }
        break;

      case 'data':
        const data = new Date();
        const dataFormatada = `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()}`;
        if (campo.rotulo) {
          doc.text(`${campo.rotulo}: ${dataFormatada}`, x, y + tamanhoFonte/6);
        } else {
          doc.text(dataFormatada, x, y + tamanhoFonte/6);
        }
        break;

      case 'textoGenerico':
        doc.text(campo.valor || '', x, y + tamanhoFonte/6);
        break;
    }
  }
}

function obterValorCampo(item: ItemData, campo: string, valorPadrao: any = ''): any {
  return item[campo] !== undefined ? item[campo] : valorPadrao;
}
