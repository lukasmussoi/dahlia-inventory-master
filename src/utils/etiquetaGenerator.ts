
import { jsPDF } from 'jspdf';
import { ModeloEtiqueta, CampoEtiqueta } from '@/models/etiquetaCustomModel';
import { generateBarcode } from './barcodeUtils';

interface EtiquetaData {
  nome?: string;
  codigo?: string;
  codigoBarras?: string;
  preco?: number;
  precoCusto?: number;
  unidade?: string;
  fornecedor?: string;
  localizacao?: string;
  gtin?: string;
  descricao?: string;
  dataValidade?: string;
  // Campos para contatos
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  // Campos para notas fiscais
  numero?: string;
  data?: string;
  cliente?: string;
  valorTotal?: number;
  chaveAcesso?: string;
  // Campos para ordens de serviço
  status?: string;
  // Campos para vendas
  formaPagamento?: string;
}

export async function gerarEtiquetasPDF(
  modelo: ModeloEtiqueta,
  dados: EtiquetaData[],
  copias: number = 1
): Promise<string> {
  // Definir dimensões da página
  let larguraPagina = 210; // A4 padrão em mm
  let alturaPagina = 297;
  
  if (modelo.formatoPagina === 'personalizado' && modelo.larguraPagina && modelo.alturaPagina) {
    larguraPagina = modelo.larguraPagina;
    alturaPagina = modelo.alturaPagina;
  } else if (modelo.formatoPagina === 'A3') {
    larguraPagina = 297;
    alturaPagina = 420;
  } else if (modelo.formatoPagina === 'A5') {
    larguraPagina = 148;
    alturaPagina = 210;
  } else if (modelo.formatoPagina === 'A2') {
    larguraPagina = 420;
    alturaPagina = 594;
  }
  
  // Trocar largura e altura se for paisagem
  if (modelo.orientacao === 'paisagem') {
    [larguraPagina, alturaPagina] = [alturaPagina, larguraPagina];
  }
  
  // Criar PDF
  const doc = new jsPDF({
    orientation: modelo.orientacao === 'paisagem' ? 'landscape' : 'portrait',
    unit: 'mm',
    format: modelo.formatoPagina === 'personalizado' ? [larguraPagina, alturaPagina] : modelo.formatoPagina
  });
  
  // Calcular quantas etiquetas cabem por página
  const larguraEtiqueta = modelo.largura + modelo.espacamentoHorizontal;
  const alturaEtiqueta = modelo.altura + modelo.espacamentoVertical;
  
  const areaUtil = {
    largura: larguraPagina - modelo.margemEsquerda - modelo.margemDireita,
    altura: alturaPagina - modelo.margemSuperior - modelo.margemInferior
  };
  
  const etiquetasPorLinha = Math.floor(areaUtil.largura / larguraEtiqueta);
  const etiquetasPorColuna = Math.floor(areaUtil.altura / alturaEtiqueta);
  const etiquetasPorPagina = etiquetasPorLinha * etiquetasPorColuna;
  
  // Variáveis para controlar a posição atual
  let etiquetaAtual = 0;
  let paginaAtual = 1;
  
  // Cache para códigos de barras
  const barcodeCache: {[key: string]: string} = {};
  
  // Para cada item, gerar o número de cópias solicitado
  for (const item of dados) {
    for (let i = 0; i < copias; i++) {
      // Calcular posição na página
      const coluna = etiquetaAtual % etiquetasPorLinha;
      const linha = Math.floor((etiquetaAtual % etiquetasPorPagina) / etiquetasPorLinha);
      
      // Se for uma nova página, adicionar
      if (etiquetaAtual > 0 && etiquetaAtual % etiquetasPorPagina === 0) {
        doc.addPage();
        paginaAtual++;
      }
      
      // Posição da etiqueta na página
      const x = modelo.margemEsquerda + coluna * larguraEtiqueta;
      const y = modelo.margemSuperior + linha * alturaEtiqueta;
      
      // Desenhar etiqueta
      await desenharEtiqueta(doc, modelo, item, x, y, barcodeCache);
      
      etiquetaAtual++;
    }
  }
  
  // Retornar URL do PDF gerado
  return URL.createObjectURL(doc.output('blob'));
}

async function desenharEtiqueta(
  doc: jsPDF,
  modelo: ModeloEtiqueta,
  dados: EtiquetaData,
  x: number,
  y: number,
  barcodeCache: {[key: string]: string}
): Promise<void> {
  // Para cada campo na etiqueta
  for (const campo of modelo.campos) {
    // Posição do campo dentro da etiqueta
    const campoX = x + campo.x;
    const campoY = y + campo.y;
    
    // Configurar fonte
    if (campo.fonte) {
      const estilo = (campo.negrito ? 'bold' : '') + (campo.italico ? 'italic' : '');
      doc.setFont(campo.fonte, estilo || 'normal');
    }
    
    if (campo.tamanhoFonte) {
      doc.setFontSize(campo.tamanhoFonte);
    }
    
    // Renderizar campo de acordo com seu tipo
    switch (campo.tipo) {
      case 'texto':
        renderizarTexto(doc, campo, campoX, campoY, dados);
        break;
      
      case 'preco':
        renderizarPreco(doc, campo, campoX, campoY, dados);
        break;
      
      case 'codigo':
        renderizarCodigo(doc, campo, campoX, campoY, dados);
        break;
      
      case 'codigoBarras':
        await renderizarCodigoBarras(doc, campo, campoX, campoY, dados, barcodeCache);
        break;
      
      case 'data':
        renderizarData(doc, campo, campoX, campoY, dados);
        break;
      
      case 'textoGenerico':
        renderizarTextoGenerico(doc, campo, campoX, campoY);
        break;
    }
  }
}

function renderizarTexto(
  doc: jsPDF,
  campo: CampoEtiqueta,
  x: number,
  y: number,
  dados: EtiquetaData
): void {
  let valor = '';
  
  // Obter valor do campo correspondente nos dados
  switch (campo.valor) {
    case 'nome':
      valor = dados.nome || '';
      break;
    case 'fornecedor':
      valor = dados.fornecedor || '';
      break;
    case 'unidade':
      valor = dados.unidade || '';
      break;
    case 'localizacao':
      valor = dados.localizacao || '';
      break;
    case 'gtin':
      valor = dados.gtin || '';
      break;
    case 'descricao':
      valor = dados.descricao || '';
      break;
    // Para contatos
    case 'endereco':
      valor = dados.endereco || '';
      break;
    case 'cidade':
      valor = dados.cidade || '';
      break;
    case 'estado':
      valor = dados.estado || '';
      break;
    case 'cep':
      valor = dados.cep || '';
      break;
    case 'telefone':
      valor = dados.telefone || '';
      break;
    case 'email':
      valor = dados.email || '';
      break;
    // Para notas/vendas
    case 'cliente':
      valor = dados.cliente || '';
      break;
    case 'numero':
      valor = dados.numero || '';
      break;
    case 'status':
      valor = dados.status || '';
      break;
    case 'formaPagamento':
      valor = dados.formaPagamento || '';
      break;
    case 'chaveAcesso':
      valor = dados.chaveAcesso || '';
      break;
  }
  
  // Adicionar rótulo se existir
  if (campo.rotulo) {
    valor = `${campo.rotulo} ${valor}`;
  }
  
  // Renderizar texto
  doc.text(valor, x, y + campo.altura / 2 + (campo.tamanhoFonte || 12) / 4);
}

function renderizarPreco(
  doc: jsPDF,
  campo: CampoEtiqueta,
  x: number,
  y: number,
  dados: EtiquetaData
): void {
  let valor = 0;
  
  // Obter valor do campo correspondente nos dados
  if (campo.valor === 'preco') {
    valor = dados.preco || 0;
  } else if (campo.valor === 'precoCusto') {
    valor = dados.precoCusto || 0;
  } else if (campo.valor === 'valorTotal') {
    valor = dados.valorTotal || 0;
  }
  
  // Formatar preço
  const precoFormatado = valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  // Adicionar símbolo da moeda se existir
  const textoPreco = (campo.moeda || '') + precoFormatado;
  
  // Adicionar rótulo se existir
  const textoFinal = campo.rotulo ? `${campo.rotulo} ${textoPreco}` : textoPreco;
  
  // Renderizar texto
  doc.text(textoFinal, x, y + campo.altura / 2 + (campo.tamanhoFonte || 12) / 4);
}

function renderizarCodigo(
  doc: jsPDF,
  campo: CampoEtiqueta,
  x: number,
  y: number,
  dados: EtiquetaData
): void {
  let valor = '';
  
  // Obter valor do campo correspondente nos dados
  if (campo.valor === 'codigo') {
    valor = dados.codigo || '';
  }
  
  // Adicionar rótulo se existir
  const textoFinal = campo.rotulo ? `${campo.rotulo} ${valor}` : valor;
  
  // Renderizar texto
  doc.text(textoFinal, x, y + campo.altura / 2 + (campo.tamanhoFonte || 12) / 4);
}

async function renderizarCodigoBarras(
  doc: jsPDF,
  campo: CampoEtiqueta,
  x: number,
  y: number,
  dados: EtiquetaData,
  barcodeCache: {[key: string]: string}
): Promise<void> {
  let valor = '';
  
  // Obter valor do campo correspondente nos dados
  if (campo.valor === 'codigoBarras') {
    valor = dados.codigoBarras || '';
  } else if (campo.valor === 'codigo') {
    valor = dados.codigo || '';
  } else if (campo.valor === 'gtin') {
    valor = dados.gtin || '';
  }
  
  if (!valor) {
    return; // Sem código para gerar
  }
  
  // Verificar cache primeiro
  let barcodeData = barcodeCache[valor];
  
  if (!barcodeData) {
    // Gerar código de barras
    barcodeData = await generateBarcode(valor);
    barcodeCache[valor] = barcodeData;
  }
  
  // Adicionar código de barras
  doc.addImage(
    barcodeData, 
    'PNG', 
    x, 
    y, 
    campo.largura, 
    campo.altura
  );
  
  // Adicionar texto do código se necessário
  if (campo.mostrarCodigo) {
    doc.setFontSize(8);
    doc.text(
      valor, 
      x + campo.largura / 2, 
      y + campo.altura + 3, 
      { align: 'center' }
    );
  }
}

function renderizarData(
  doc: jsPDF,
  campo: CampoEtiqueta,
  x: number,
  y: number,
  dados: EtiquetaData
): void {
  let valor = '';
  
  // Obter valor do campo correspondente nos dados
  if (campo.valor === 'dataValidade') {
    valor = dados.dataValidade || '';
  } else if (campo.valor === 'data') {
    valor = dados.data || '';
  }
  
  // Formatar data se for uma string de data válida
  if (valor && !isNaN(Date.parse(valor))) {
    const data = new Date(valor);
    valor = data.toLocaleDateString('pt-BR');
  }
  
  // Adicionar rótulo se existir
  const textoFinal = campo.rotulo ? `${campo.rotulo} ${valor}` : valor;
  
  // Renderizar texto
  doc.text(textoFinal, x, y + campo.altura / 2 + (campo.tamanhoFonte || 12) / 4);
}

function renderizarTextoGenerico(
  doc: jsPDF,
  campo: CampoEtiqueta,
  x: number,
  y: number
): void {
  // Renderizar texto personalizado
  doc.text(campo.valor, x, y + campo.altura / 2 + (campo.tamanhoFonte || 12) / 4);
}
