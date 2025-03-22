
import { useState } from "react";
import { toast } from "sonner";
import { useEtiquetaState } from "./useEtiquetaState";
import { usePageConfiguration } from "./usePageConfiguration";
import { useLabelManagement } from "./useLabelManagement";
import { useElementManagement } from "./useElementManagement";
import { useDragAndDrop } from "./useDragAndDrop";
import { usePDFGeneration } from "./usePDFGeneration";

/**
 * Hook principal que combina os hooks específicos para o editor de etiquetas
 */
export function useEtiquetaCreator(initialData?: any, autoAdjustDimensions = false) {
  // Hooks específicos
  const etiquetaState = useEtiquetaState(initialData);
  const pageConfig = usePageConfiguration(initialData);
  const labelManagement = useLabelManagement(
    initialData, 
    pageConfig.pageSize, 
    etiquetaState.snapToGrid, 
    etiquetaState.gridSize
  );
  const elementManagement = useElementManagement(
    labelManagement.labels,
    labelManagement.setLabels,
    labelManagement.selectedLabelId,
    labelManagement.snapToGridValue
  );
  const dragAndDrop = useDragAndDrop(
    etiquetaState.editorRef,
    labelManagement.labels,
    labelManagement.setLabels,
    labelManagement.selectedLabelId,
    etiquetaState.zoom,
    labelManagement.snapToGridValue
  );
  const pdfGeneration = usePDFGeneration();

  // Funções adaptadoras para o componente ElementPanel
  const handleDeleteElement = () => {
    if (etiquetaState.selectedElement) {
      elementManagement.handleDeleteElement(etiquetaState.selectedElement);
      etiquetaState.setSelectedElement(null);
    }
  };

  const handleUpdateElement = (property: string, value: any) => {
    if (etiquetaState.selectedElement) {
      elementManagement.handleUpdateElement(etiquetaState.selectedElement, property, value);
    }
  };

  const handleSetAlignment = (alignment: string) => {
    if (etiquetaState.selectedElement) {
      elementManagement.handleSetAlignment(etiquetaState.selectedElement, alignment);
    }
  };

  /**
   * Manipula a geração de prévia do PDF
   */
  const handlePreview = async () => {
    if (labelManagement.labels.length === 0) {
      toast.error("Adicione pelo menos uma etiqueta para visualizar");
      return;
    }
    
    if (labelManagement.selectedLabelId === null) {
      toast.error("Selecione uma etiqueta para visualizar");
      return;
    }
    
    console.log("Iniciando preview com orientação:", pageConfig.pageOrientation);
    etiquetaState.setIsGeneratingPdf(true);
    
    try {
      // Usando a função generatePreview que recebe um único objeto de configuração
      const pdfUrl = await pdfGeneration.handlePreview({
        modelName: etiquetaState.modelName || "Modelo sem nome",
        labels: labelManagement.labels,
        pageFormat: pageConfig.pageFormat,
        pageSize: pageConfig.pageSize,
        pageMargins: pageConfig.pageMargins,
        labelSpacing: pageConfig.labelSpacing,
        autoAdjustDimensions,
        pageOrientation: pageConfig.pageOrientation
      });
      
      etiquetaState.setPreviewPdfUrl(pdfUrl);
      etiquetaState.setIsPreviewDialogOpen(true);
    } catch (error) {
      console.error("Erro ao gerar pré-visualização:", error);
      if (error instanceof Error) {
        toast.error(`Erro na pré-visualização: ${error.message}`);
      } else {
        toast.error("Não foi possível gerar a pré-visualização");
      }
    } finally {
      etiquetaState.setIsGeneratingPdf(false);
    }
  };

  /**
   * Faz o download do PDF gerado
   */
  const handleDownloadPdf = (modelName: string) => {
    if (!etiquetaState.previewPdfUrl) return;
    
    const a = document.createElement("a");
    a.href = etiquetaState.previewPdfUrl;
    a.download = `${modelName || "modelo-etiqueta"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * Salva o modelo de etiqueta
   */
  const handleSave = (onSave: (data: any) => void) => {
    if (!etiquetaState.modelName.trim()) {
      toast.error("Por favor, informe um nome para o modelo");
      document.getElementById("model-name-input")?.focus();
      return;
    }
    
    // Verificar se existe ao menos uma etiqueta
    if (labelManagement.labels.length === 0) {
      toast.error("Por favor, adicione pelo menos uma etiqueta");
      return;
    }
    
    // Verificar se todas as etiquetas têm pelo menos um elemento
    const emptyLabels = labelManagement.labels.filter(label => label.elements.length === 0);
    if (emptyLabels.length > 0) {
      toast.error(`A etiqueta "${emptyLabels[0].name}" não possui elementos. Adicione pelo menos um elemento em cada etiqueta.`);
      labelManagement.setSelectedLabelId(emptyLabels[0].id);
      return;
    }
    
    // Se tiver múltiplas etiquetas, usar a primeira como referência principal
    const primaryLabel = labelManagement.labels[0];
    
    // Mapear para o formato esperado pelo backend
    const modelData = {
      nome: etiquetaState.modelName,
      descricao: etiquetaState.modelName,
      campos: primaryLabel.elements.map(el => ({
        tipo: el.type,
        x: el.x,
        y: el.y,
        largura: el.width,
        altura: el.height,
        tamanhoFonte: el.fontSize,
        alinhamento: el.align
      })),
      largura: primaryLabel.width,
      altura: primaryLabel.height,
      formatoPagina: pageConfig.pageFormat,
      orientacao: pageConfig.pageOrientation,
      margemSuperior: pageConfig.pageMargins.top,
      margemInferior: pageConfig.pageMargins.bottom,
      margemEsquerda: pageConfig.pageMargins.left,
      margemDireita: pageConfig.pageMargins.right,
      espacamentoHorizontal: pageConfig.labelSpacing.horizontal,
      espacamentoVertical: pageConfig.labelSpacing.vertical,
      larguraPagina: pageConfig.pageSize.width,
      alturaPagina: pageConfig.pageSize.height
    };
    
    console.log("Dados do modelo a serem salvos:", modelData);
    
    try {
      // Chamar a função onSave e verificar se houve sucesso
      if (typeof onSave === 'function') {
        toast.info("Salvando modelo de etiqueta...");
        // Correção: Chamar onSave sem atribuir o retorno
        onSave(modelData);
      } else {
        console.error("A função onSave não foi fornecida ao componente EtiquetaCreator");
        toast.error("Erro ao salvar: configuração incorreta");
      }
    } catch (error) {
      console.error("Erro ao chamar onSave:", error);
      toast.error("Erro ao salvar modelo de etiqueta");
    }
  };

  return {
    // Estado básico
    ...etiquetaState,
    
    // Configurações de página
    ...pageConfig,
    
    // Gerenciamento de etiquetas
    ...labelManagement,
    
    // Elementos - incluir as funções adaptadas para o elemento selecionado
    ...elementManagement,
    handleDeleteElement,
    handleUpdateElement,
    handleSetAlignment,
    
    // Arrastar e soltar
    ...dragAndDrop,
    
    // Geração de PDF
    ...pdfGeneration,
    handlePreview,
    handleDownloadPdf: () => handleDownloadPdf(etiquetaState.modelName),
    
    // Funções específicas
    handleSave
  };
}
