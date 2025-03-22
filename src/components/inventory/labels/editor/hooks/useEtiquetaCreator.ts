
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { usePageConfiguration } from "./usePageConfiguration";
import { useLabelManagement } from "./useLabelManagement";
import { useElementManagement } from "./useElementManagement";
import { useDragAndDrop } from "./useDragAndDrop";
import { usePDFGeneration } from "./usePDFGeneration";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import type { CampoEtiqueta } from "@/types/etiqueta";

export function useEtiquetaCreator(initialData?: any, autoAdjustDimensions = false) {
  // Estado básico
  const [modelName, setModelName] = useState(initialData?.nome || "");
  const [activeTab, setActiveTab] = useState<"elementos" | "etiquetas" | "config">("etiquetas");
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(initialData?.tamanhoGrade || 5);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Log para debug da inicialização
  useEffect(() => {
    console.log("useEtiquetaCreator inicializado com dados:", initialData);
    if (initialData) {
      console.log("Campos iniciais:", initialData.campos);
      console.log("Orientação inicial:", initialData.orientacao);
      console.log("Formato página inicial:", initialData.formatoPagina);
      console.log("Tamanho grade inicial:", initialData.tamanhoGrade);
    }
  }, [initialData]);
  
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
  const initialLabels = initialData?.campos ? [
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
        x: campo.x || 0,
        y: campo.y || 0,
        width: campo.largura || 40,
        height: campo.altura || 10,
        fontSize: campo.tamanhoFonte || 10,
        align: campo.alinhamento || 'left'
      }))
    }
  ] : [];
  
  // Log dos labels gerados a partir dos campos
  useEffect(() => {
    if (initialLabels.length > 0) {
      console.log("Labels inicializados:", initialLabels);
    }
  }, [initialLabels]);
  
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
    labelManagement.snapToGridValue
  );

  // Drag & Drop
  const dragAndDrop = useDragAndDrop(
    editorRef,
    labelManagement.labels,
    labelManagement.setLabels,
    labelManagement.selectedLabelId,
    zoom,
    labelManagement.snapToGridValue
  );
  
  // Geração de PDF
  const pdfGeneration = usePDFGeneration();
  
  // Mostrar pré-visualização
  const handlePreview = () => {
    console.log("Solicitando pré-visualização com orientação:", pageConfiguration.pageOrientation);
    console.log("Propriedades da página:", {
      format: pageConfiguration.pageFormat,
      orientation: pageConfiguration.pageOrientation,
      size: pageConfiguration.pageSize,
      margins: pageConfiguration.pageMargins
    });
    
    // Verificar se há etiquetas para visualizar
    if (labelManagement.labels.length === 0) {
      toast.error("Adicione pelo menos uma etiqueta para visualizar");
      return;
    }
    
    // Log detalhado dos dados que serão usados na geração do PDF
    console.log("Dados para gerar PDF:", {
      labels: labelManagement.labels,
      pageFormat: pageConfiguration.pageFormat,
      pageOrientation: pageConfiguration.pageOrientation,
      pageSize: pageConfiguration.pageSize,
      marginTop: pageConfiguration.pageMargins.top,
      marginBottom: pageConfiguration.pageMargins.bottom,
      marginLeft: pageConfiguration.pageMargins.left,
      marginRight: pageConfiguration.pageMargins.right,
      spacing: pageConfiguration.labelSpacing,
      autoAdjust: autoAdjustDimensions,
      gridSize: gridSize
    });
    
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
      pageOrientation: pageConfiguration.pageOrientation,
      gridSize: gridSize
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
      
      console.log("Preparando dados para salvar modelo:", {
        nome: modelName,
        largura: primeiraEtiqueta.width,
        altura: primeiraEtiqueta.height,
        formatoPagina: pageConfiguration.pageFormat,
        orientacao: pageConfiguration.pageOrientation,
        pageSize: pageConfiguration.pageSize,
        margensSupInf: `${pageConfiguration.pageMargins.top}/${pageConfiguration.pageMargins.bottom}`,
        margensEsqDir: `${pageConfiguration.pageMargins.left}/${pageConfiguration.pageMargins.right}`,
        espacamento: `${pageConfiguration.labelSpacing.horizontal}/${pageConfiguration.labelSpacing.vertical}`,
        elementCount: primeiraEtiqueta.elements.length
      });
      
      // Mapear os elementos para o formato esperado pelo backend
      const camposMapeados: CampoEtiqueta[] = primeiraEtiqueta.elements.map((element: any) => {
        console.log("Mapeando elemento:", element);
        return {
          tipo: element.type as "nome" | "codigo" | "preco",
          x: element.x,
          y: element.y,
          largura: element.width,
          altura: element.height,
          tamanhoFonte: element.fontSize,
          alinhamento: element.align as "left" | "center" | "right"
        };
      });
      
      console.log("Campos mapeados:", camposMapeados);
      
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
        tamanhoGrade: gridSize,
        campos: camposMapeados
      };
      
      console.log("Dados completos para salvar:", modelData);
      
      // Verificar se estamos editando ou criando
      let result;
      if (initialData?.id) {
        console.log(`Atualizando modelo existente (ID: ${initialData.id})`);
        result = await EtiquetaCustomModel.update(initialData.id, modelData);
        console.log("Resultado da atualização:", result);
        
        if (result) {
          toast.success("Modelo atualizado com sucesso!");
        } else {
          console.error("Falha na atualização do modelo");
          toast.error("Erro ao atualizar modelo");
          return;
        }
      } else {
        console.log("Criando novo modelo");
        result = await EtiquetaCustomModel.create(modelData);
        console.log("Resultado da criação:", result);
        
        if (result) {
          toast.success("Modelo criado com sucesso!");
        } else {
          console.error("Falha na criação do modelo");
          toast.error("Erro ao criar modelo");
          return;
        }
      }
      
      if (result) {
        console.log("Chamando callback onSave");
        onSave(modelData);
      }
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      toast.error("Erro ao salvar modelo: " + (error instanceof Error ? error.message : "erro desconhecido"));
    }
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
    // Adicionando explicitamente selectedElement e setSelectedElement ao retorno
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
    handleOptimizeLayout: labelManagement.handleOptimizeLayout
  };
}
