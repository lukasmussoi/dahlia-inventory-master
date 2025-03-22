
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { usePageConfiguration } from "./usePageConfiguration";
import { useLabelManagement } from "./useLabelManagement";
import { useElementManagement } from "./useElementManagement";
import { useDragAndDrop } from "./useDragAndDrop";
import { usePDFGeneration } from "./usePDFGeneration";
import { LabelElement, LabelType } from "../types";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import type { CampoEtiqueta } from "@/types/etiqueta";

export function useEtiquetaCreator(initialData?: any, autoAdjustDimensions = false) {
  // Estado básico
  const [modelName, setModelName] = useState(initialData?.nome || "");
  const [activeTab, setActiveTab] = useState<"elementos" | "etiquetas" | "config">("etiquetas");
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(5);
  const editorRef = useRef<HTMLDivElement>(null);
  // Adicionando o estado selectedElement que estava faltando
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Log para debug
  useEffect(() => {
    console.log("useEtiquetaCreator inicializado com dados:", initialData);
  }, []);
  
  // Hooks de gerenciamento de configurações e elementos
  const pageConfiguration = usePageConfiguration({
    formatoPagina: initialData?.formatoPagina || "A4",
    orientacao: initialData?.orientacao || "retrato",
    larguraPagina: initialData?.larguraPagina || 210,
    alturaPagina: initialData?.alturaPagina || 297,
    margemSuperior: initialData?.margemSuperior || 10,
    margemInferior: initialData?.margemInferior || 10,
    margemEsquerda: initialData?.margemEsquerda || 10,
    margemDireita: initialData?.margemDireita || 10,
    espacamentoHorizontal: initialData?.espacamentoHorizontal || 2,
    espacamentoVertical: initialData?.espacamentoVertical || 2
  });
  
  // Inicializar as etiquetas se houver dados iniciais
  const initialLabels: LabelType[] = initialData?.campos ? [
    {
      id: 1,
      name: initialData.nome || "Etiqueta",
      x: 10,
      y: 10,
      width: initialData.largura || 80,
      height: initialData.altura || 30,
      elements: initialData.campos.map((campo: any, index: number) => ({
        id: `element-${index}`,
        type: campo.tipo,
        x: campo.x,
        y: campo.y,
        width: campo.largura,
        height: campo.altura,
        fontSize: campo.tamanhoFonte,
        align: campo.alinhamento || 'left'
      }))
    }
  ] : [];
  
  // Gerenciamento de etiquetas
  const labelManagement = useLabelManagement(
    initialLabels,
    pageConfiguration.pageSize,
    snapToGrid,
    gridSize
  );
  
  // Gerenciamento de elementos
  const elementManagement = useElementManagement(
    labelManagement.labels, 
    labelManagement.setLabels, 
    labelManagement.selectedLabelId,
    labelManagement.snapToGridValue // Usando a função snapToGridValue do labelManagement
  );

  // Drag & Drop
  const dragAndDrop = useDragAndDrop(
    editorRef,
    labelManagement.labels,
    labelManagement.setLabels,
    labelManagement.selectedLabelId, // Passando selectedLabelId em vez de snapToGrid
    zoom,
    labelManagement.snapToGridValue // Passando a função snapToGridValue
  );
  
  // Geração de PDF
  const pdfGeneration = usePDFGeneration();
  
  // Funções
  
  // Mostrar pré-visualização
  const handlePreview = () => {
    // Log para debug
    console.log("Solicitando pré-visualização com orientação:", pageConfiguration.pageOrientation);
    
    // Verificar se há etiquetas para visualizar
    if (labelManagement.labels.length === 0) {
      toast.error("Adicione pelo menos uma etiqueta para visualizar");
      return;
    }
    
    // Chamada para geração de PDF com todos os parâmetros necessários
    pdfGeneration.handlePreview({
      modelName: modelName || "Modelo sem nome",
      labels: labelManagement.labels,
      pageFormat: pageConfiguration.pageFormat,
      pageSize: pageConfiguration.pageSize,
      pageMargins: {
        top: pageConfiguration.pageMargins.top,
        bottom: pageConfiguration.pageMargins.bottom,
        left: pageConfiguration.pageMargins.left,
        right: pageConfiguration.pageMargins.right,
      },
      labelSpacing: pageConfiguration.labelSpacing,
      autoAdjustDimensions,
      pageOrientation: pageConfiguration.pageOrientation
    });
  };
  
  // Salvar o modelo
  const handleSave = async (onSave: (data: any) => void) => {
    if (!modelName.trim()) {
      toast.error("O nome do modelo é obrigatório");
      return;
    }
    
    if (labelManagement.labels.length === 0) {
      toast.error("Adicione pelo menos uma etiqueta");
      return;
    }
    
    try {
      // Obter a primeira etiqueta (atualmente só suportamos uma etiqueta)
      const primeiraEtiqueta = labelManagement.labels[0];
      
      // Log para debug
      console.log("Dados para salvar (antes de formatação):", {
        nome: modelName,
        largura: primeiraEtiqueta.width,
        altura: primeiraEtiqueta.height,
        formatoPagina: pageConfiguration.pageFormat,
        orientacao: pageConfiguration.pageOrientation,
        pageSize: pageConfiguration.pageSize
      });
      
      // Mapear os elementos para o formato esperado pelo backend
      const camposMapeados: CampoEtiqueta[] = primeiraEtiqueta.elements.map((element: LabelElement) => ({
        tipo: element.type as "nome" | "codigo" | "preco",
        x: element.x,
        y: element.y,
        largura: element.width,
        altura: element.height,
        tamanhoFonte: element.fontSize,
        alinhamento: element.align as "left" | "center" | "right"
      }));
      
      // Preparar os dados para salvamento
      const modelData = {
        nome: modelName,
        descricao: modelName,
        largura: primeiraEtiqueta.width,
        altura: primeiraEtiqueta.height,
        formatoPagina: pageConfiguration.pageFormat,
        orientacao: pageConfiguration.pageOrientation,
        margemSuperior: pageConfiguration.pageMargins.top,
        margemInferior: pageConfiguration.pageMargins.bottom,
        margemEsquerda: pageConfiguration.pageMargins.left,
        margemDireita: pageConfiguration.pageMargins.right,
        espacamentoHorizontal: pageConfiguration.labelSpacing.horizontal,
        espacamentoVertical: pageConfiguration.labelSpacing.vertical,
        larguraPagina: pageConfiguration.pageSize.width,
        alturaPagina: pageConfiguration.pageSize.height,
        campos: camposMapeados
      };
      
      // Verificar se estamos editando ou criando
      let result;
      if (initialData?.id) {
        console.log(`Atualizando modelo existente (ID: ${initialData.id})`, modelData);
        result = await EtiquetaCustomModel.update(initialData.id, modelData);
        if (result) {
          toast.success("Modelo atualizado com sucesso!");
        }
      } else {
        console.log("Criando novo modelo:", modelData);
        result = await EtiquetaCustomModel.create(modelData);
        if (result) {
          toast.success("Modelo criado com sucesso!");
        }
      }
      
      if (result) {
        console.log("Salvamento bem-sucedido:", result);
        onSave(modelData);
      } else {
        console.error("Falha ao salvar modelo");
        toast.error("Erro ao salvar modelo");
      }
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      toast.error("Erro ao salvar modelo");
    }
  };

  // Organizar as etiquetas na página para maximizar o uso do espaço
  const handleOptimizeLayout = () => {
    // Verificar se há etiquetas
    if (labelManagement.labels.length === 0) {
      toast.error("Adicione pelo menos uma etiqueta para otimizar o layout");
      return;
    }
    
    // Calcular área útil da página (dentro das margens)
    const usableWidth = pageConfiguration.pageSize.width - 
                         pageConfiguration.pageMargins.left - 
                         pageConfiguration.pageMargins.right;
    const usableHeight = pageConfiguration.pageSize.height - 
                          pageConfiguration.pageMargins.top - 
                          pageConfiguration.pageMargins.bottom;
    
    // Pegar dimensões da primeira etiqueta como referência
    const firstLabel = labelManagement.labels[0];
    const labelWidth = firstLabel.width;
    const labelHeight = firstLabel.height;
    
    // Calcular quantas etiquetas cabem por linha e coluna
    const labelsPerRow = Math.floor(usableWidth / (labelWidth + pageConfiguration.labelSpacing.horizontal));
    const labelsPerColumn = Math.floor(usableHeight / (labelHeight + pageConfiguration.labelSpacing.vertical));
    
    // Calcular total de etiquetas que cabem na página
    const totalLabels = labelsPerRow * labelsPerColumn;
    
    if (totalLabels === 0) {
      toast.error("A etiqueta é maior que a área útil da página. Ajuste as dimensões.");
      return;
    }
    
    const newLabels: LabelType[] = [];
    
    // Criar etiquetas organizadas na página
    for (let row = 0; row < labelsPerColumn; row++) {
      for (let col = 0; col < labelsPerRow; col++) {
        if (newLabels.length >= totalLabels) break;
        
        // Clonar a primeira etiqueta como template
        const clonedElement = { ...labelManagement.labels[0] };
        
        // Ajustar posição
        const xPos = pageConfiguration.pageMargins.left + col * (labelWidth + pageConfiguration.labelSpacing.horizontal);
        const yPos = pageConfiguration.pageMargins.top + row * (labelHeight + pageConfiguration.labelSpacing.vertical);
        
        newLabels.push({
          ...clonedElement,
          id: newLabels.length + 1,
          name: `Etiqueta ${newLabels.length + 1}`,
          x: xPos,
          y: yPos,
          elements: clonedElement.elements.map(element => ({ ...element, id: `element-${Math.random()}` }))
        });
      }
    }
    
    // Atualizar as etiquetas
    labelManagement.setLabels(newLabels);
    toast.success(`Layout otimizado: ${newLabels.length} etiquetas dispostas em ${labelsPerRow}x${labelsPerColumn}`);
  };

  return {
    // Estado
    modelName,
    setModelName,
    activeTab,
    setActiveTab,
    zoom,
    setZoom,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    editorRef,
    // Adicionando selectedElement e setSelectedElement ao retorno
    selectedElement,
    setSelectedElement,
    
    // Labels
    ...labelManagement,
    
    // Elements
    ...elementManagement,
    
    // Drag & Drop
    ...dragAndDrop,
    
    // Configurações de página
    ...pageConfiguration,
    
    // PDF
    ...pdfGeneration,
    handlePreview,
    
    // Funções adicionais
    handleSave,
    handleOptimizeLayout
  };
}
