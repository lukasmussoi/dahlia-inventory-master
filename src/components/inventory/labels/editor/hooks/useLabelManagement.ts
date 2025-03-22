
import { useState } from "react";
import { toast } from "sonner";
import { LabelType } from "../types";

/**
 * Hook para gerenciamento de etiquetas
 */
export function useLabelManagement(
  initialData?: any,
  pageSize?: { width: number; height: number },
  snapToGrid?: boolean,
  gridSize?: number
) {
  // Estado das etiquetas
  const [labelSize, setLabelSize] = useState({ 
    width: initialData?.largura || 80, 
    height: initialData?.altura || 40 
  });
  const [nextLabelId, setNextLabelId] = useState(1);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(0);
  const [labels, setLabels] = useState<LabelType[]>([{ 
    id: 0, 
    name: "Etiqueta 1",
    x: 20, 
    y: 20, 
    width: initialData?.largura || 80,
    height: initialData?.altura || 40,
    elements: initialData?.campos?.map((campo: any, index: number) => ({
      id: `elemento-${campo.tipo}-${index}`,
      type: campo.tipo,
      x: campo.x,
      y: campo.y,
      width: campo.largura,
      height: campo.altura,
      fontSize: campo.tamanhoFonte,
      align: campo.alinhamento || "left"
    })) || []
  }]);

  /**
   * Adiciona uma nova etiqueta
   */
  const handleAddLabel = () => {
    const newLabelId = nextLabelId;
    setNextLabelId(prevId => prevId + 1);
    
    // Criar uma nova etiqueta com base na configuração atual
    const newLabel: LabelType = {
      id: newLabelId,
      name: `Etiqueta ${newLabelId + 1}`,
      x: 20,
      y: 20 + (labels.length * 10), // Posicionar abaixo das etiquetas existentes
      width: labelSize.width,
      height: labelSize.height,
      elements: [] // Começar sem elementos
    };
    
    setLabels(prevLabels => [...prevLabels, newLabel]);
    setSelectedLabelId(newLabelId); // Selecionar a nova etiqueta
    
    toast.success(`Nova etiqueta adicionada`);
  };
  
  /**
   * Duplica uma etiqueta existente
   */
  const handleDuplicateLabel = (labelId: number) => {
    const labelToDuplicate = labels.find(l => l.id === labelId);
    if (!labelToDuplicate) return;
    
    const newLabelId = nextLabelId;
    setNextLabelId(prevId => prevId + 1);
    
    // Criar uma cópia da etiqueta
    const newLabel: LabelType = {
      ...labelToDuplicate,
      id: newLabelId,
      name: `${labelToDuplicate.name} (Cópia)`,
      x: labelToDuplicate.x + 10, // Posicionar ligeiramente deslocada
      y: labelToDuplicate.y + 10,
      // Copiar todos os elementos da etiqueta
      elements: labelToDuplicate.elements.map(element => ({
        ...element,
        id: `${element.id}-copy-${Date.now()}`
      }))
    };
    
    setLabels(prevLabels => [...prevLabels, newLabel]);
    setSelectedLabelId(newLabelId); // Selecionar a nova etiqueta
    
    toast.success(`Etiqueta duplicada`);
  };
  
  /**
   * Remove uma etiqueta
   */
  const handleDeleteLabel = (labelId: number) => {
    // Impedir que todas as etiquetas sejam excluídas
    if (labels.length === 1) {
      toast.error("Deve haver pelo menos uma etiqueta");
      return;
    }
    
    setLabels(prevLabels => prevLabels.filter(l => l.id !== labelId));
    
    // Se a etiqueta excluída era a selecionada, selecionar a primeira etiqueta restante
    if (selectedLabelId === labelId) {
      const remainingLabels = labels.filter(l => l.id !== labelId);
      setSelectedLabelId(remainingLabels[0]?.id || null);
    }
    
    toast.success(`Etiqueta removida`);
  };
  
  /**
   * Atualiza o nome de uma etiqueta
   */
  const handleUpdateLabelName = (labelId: number, name: string) => {
    setLabels(prevLabels => 
      prevLabels.map(label => 
        label.id === labelId ? { ...label, name } : label
      )
    );
  };
  
  /**
   * Atualiza o tamanho de uma etiqueta
   */
  const handleUpdateLabelSize = (dimension: "width" | "height", value: number) => {
    if (selectedLabelId === null || !pageSize) return;
    
    // Validar que o tamanho da etiqueta não seja maior que a página
    value = Math.max(10, Math.min(value, dimension === "width" ? pageSize.width : pageSize.height));
    
    const newLabelSize = { ...labelSize, [dimension]: value };
    setLabelSize(newLabelSize);
    
    // Atualizar também o tamanho da etiqueta selecionada no array
    const updatedLabels = [...labels];
    const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) return;
    
    updatedLabels[labelIndex] = {
      ...updatedLabels[labelIndex],
      [dimension]: value
    };
    
    // Verificar se algum elemento está fora dos limites e ajustar se necessário
    updatedLabels[labelIndex].elements = updatedLabels[labelIndex].elements.map(element => {
      let updatedElement = { ...element };
      
      if (dimension === "width" && element.x + element.width > value) {
        if (element.x < value) {
          // Elemento está parcialmente dentro, ajustar apenas a largura
          updatedElement.width = value - element.x;
        } else {
          // Elemento está totalmente fora, reposicionar
          updatedElement.x = Math.max(0, value - element.width);
        }
      }
      
      if (dimension === "height" && element.y + element.height > value) {
        if (element.y < value) {
          // Elemento está parcialmente dentro, ajustar apenas a altura
          updatedElement.height = value - element.y;
        } else {
          // Elemento está totalmente fora, reposicionar
          updatedElement.y = Math.max(0, value - element.height);
        }
      }
      
      return updatedElement;
    });
    
    setLabels(updatedLabels);
  };
  
  /**
   * Otimiza o layout dos elementos na etiqueta
   */
  const handleOptimizeLayout = () => {
    if (selectedLabelId === null) return;
    
    // Implementação básica de otimização: centralizar todos os elementos
    const updatedLabels = [...labels];
    const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) return;
    
    const label = updatedLabels[labelIndex];
    
    // Organizar elementos em uma grade lógica
    const elementsCount = label.elements.length;
    if (elementsCount === 0) return;
    
    if (elementsCount === 1) {
      // Centralizar o único elemento
      const element = label.elements[0];
      element.x = Math.floor((label.width - element.width) / 2);
      element.y = Math.floor((label.height - element.height) / 2);
    } else if (elementsCount === 2) {
      // Organizar dois elementos um acima do outro
      const gap = 5;
      const totalHeight = label.elements.reduce((sum, el) => sum + el.height, 0) + gap;
      let currentY = Math.floor((label.height - totalHeight) / 2);
      
      for (let element of label.elements) {
        element.x = Math.floor((label.width - element.width) / 2);
        element.y = currentY;
        currentY += element.height + gap;
      }
    } else if (elementsCount === 3) {
      // Organizar três elementos em uma configuração adequada
      const nomeElement = label.elements.find(el => el.type === "nome");
      const codigoElement = label.elements.find(el => el.type === "codigo");
      const precoElement = label.elements.find(el => el.type === "preco");
      
      if (nomeElement && codigoElement && precoElement) {
        // Nome no topo
        nomeElement.x = Math.floor((label.width - nomeElement.width) / 2);
        nomeElement.y = 2;
        
        // Código no meio
        codigoElement.x = Math.floor((label.width - codigoElement.width) / 2);
        codigoElement.y = nomeElement.y + nomeElement.height + 2;
        
        // Preço na parte inferior
        precoElement.x = Math.floor((label.width - precoElement.width) / 2);
        precoElement.y = codigoElement.y + codigoElement.height + 2;
      }
    }
    
    setLabels(updatedLabels);
    toast.success("Layout otimizado!");
  };

  // Função auxiliar para snap to grid
  const snapToGridValue = (value: number) => {
    if (!snapToGrid || !gridSize) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  return {
    // Estado
    labelSize,
    labels,
    selectedLabelId,
    setSelectedLabelId,
    
    // Funções
    handleAddLabel,
    handleDuplicateLabel,
    handleDeleteLabel,
    handleUpdateLabelName,
    handleUpdateLabelSize,
    handleOptimizeLayout,
    snapToGridValue
  };
}
