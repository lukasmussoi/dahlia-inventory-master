
import { useState } from "react";
import { toast } from "sonner";
import { LabelElement, ElementType } from "../types";

/**
 * Hook para gerenciamento de elementos nas etiquetas
 */
export function useElementManagement(
  labels: any[],
  setLabels: React.Dispatch<React.SetStateAction<any[]>>,
  selectedLabelId: number | null,
  snapToGridValue: (value: number) => number
) {
  // Elementos disponíveis
  const elements = [
    { 
      id: "nome", 
      name: "Nome do Produto", 
      defaultWidth: 60, 
      defaultHeight: 15, 
      defaultFontSize: 10, 
      defaultAlign: "left" 
    }, 
    { 
      id: "codigo", 
      name: "Código de Barras", 
      defaultWidth: 60, 
      defaultHeight: 20, // Aumentado para comportar melhor o código de barras
      defaultFontSize: 8,
      defaultAlign: "center" // Alinhamento centralizado para o código de barras
    }, 
    { 
      id: "preco", 
      name: "Preço", 
      defaultWidth: 40, 
      defaultHeight: 15, 
      defaultFontSize: 12, 
      defaultAlign: "center" 
    }
  ];

  /**
   * Adiciona um elemento a uma etiqueta
   */
  const handleAddElement = (elementType: string) => {
    if (selectedLabelId === null) {
      toast.error("Selecione uma etiqueta primeiro");
      return "";
    }
    
    console.log(`Adicionando elemento do tipo ${elementType} à etiqueta ${selectedLabelId}`);
    
    const labelIndex = labels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) {
      console.error(`Etiqueta de ID ${selectedLabelId} não encontrada`);
      return "";
    }
    
    // Verificar se o elemento já existe
    const elementExists = labels[labelIndex].elements.some((el: any) => el.type === elementType);
    if (elementExists) {
      toast.error(`Este elemento já foi adicionado na etiqueta`);
      return "";
    }
    
    const elementTemplate = elements.find(e => e.id === elementType);
    if (!elementTemplate) {
      console.error(`Template para o elemento do tipo ${elementType} não encontrado`);
      return "";
    }
    
    // Posicionar o elemento no centro da etiqueta
    const label = labels[labelIndex];
    const defaultX = Math.max(0, (label.width - elementTemplate.defaultWidth) / 2);
    const defaultY = Math.max(0, (label.height - elementTemplate.defaultHeight) / 2);
    
    const newElement = {
      id: `elemento-${elementType}-${Date.now()}`,
      type: elementType,
      x: snapToGridValue(defaultX),
      y: snapToGridValue(defaultY),
      width: elementTemplate.defaultWidth,
      height: elementTemplate.defaultHeight,
      fontSize: elementTemplate.defaultFontSize,
      align: elementTemplate.defaultAlign || "left"
    };
    
    console.log("Novo elemento criado:", newElement);
    
    const updatedLabels = [...labels];
    updatedLabels[labelIndex].elements.push(newElement);
    setLabels(updatedLabels);
    
    toast.success(`${elementTemplate.name} adicionado`);
    return newElement.id;
  };
  
  /**
   * Remove um elemento de uma etiqueta
   */
  const handleDeleteElement = (elementId: string | null) => {
    if (!elementId || selectedLabelId === null) {
      console.log("Não é possível excluir elemento: ID nulo ou etiqueta não selecionada");
      return;
    }
    
    console.log(`Excluindo elemento ${elementId} da etiqueta ${selectedLabelId}`);
    
    const updatedLabels = [...labels];
    const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) {
      console.error(`Etiqueta de ID ${selectedLabelId} não encontrada para exclusão do elemento`);
      return;
    }
    
    const elementIndex = updatedLabels[labelIndex].elements.findIndex((el: any) => el.id === elementId);
    if (elementIndex === -1) {
      console.error(`Elemento de ID ${elementId} não encontrado para exclusão`);
      return;
    }
    
    const elementType = updatedLabels[labelIndex].elements[elementIndex].type;
    console.log(`Removendo elemento do tipo ${elementType}`);
    
    updatedLabels[labelIndex].elements.splice(elementIndex, 1);
    setLabels(updatedLabels);
    
    toast.success(`Elemento removido`);
  };
  
  /**
   * Atualiza um elemento
   */
  const handleUpdateElement = (elementId: string | null, property: string, value: any) => {
    if (!elementId || selectedLabelId === null) {
      console.log("Não é possível atualizar elemento: ID nulo ou etiqueta não selecionada");
      return;
    }
    
    console.log(`Atualizando elemento ${elementId}, propriedade ${property} para ${value}`);
    
    const updatedLabels = [...labels];
    const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) {
      console.error(`Etiqueta de ID ${selectedLabelId} não encontrada para atualização do elemento`);
      return;
    }
    
    const label = updatedLabels[labelIndex];
    const elementIndex = label.elements.findIndex((el: any) => el.id === elementId);
    if (elementIndex === -1) {
      console.error(`Elemento de ID ${elementId} não encontrado para atualização`);
      return;
    }
    
    const element = label.elements[elementIndex];
    console.log(`Elemento encontrado para atualização:`, element);
    
    // Garantir que os valores estão dentro dos limites
    if (property === 'x' || property === 'y' || property === 'width' || property === 'height') {
      value = Number(value);
      
      // Aplicar snap to grid
      if (property === 'x' || property === 'y') {
        value = snapToGridValue(value);
      }
      
      // Limites para x e width
      if (property === 'x') {
        value = Math.max(0, Math.min(value, label.width - element.width));
      }
      else if (property === 'width') {
        value = Math.max(10, Math.min(value, label.width - element.x));
      }
      
      // Limites para y e height
      if (property === 'y') {
        value = Math.max(0, Math.min(value, label.height - element.height));
      }
      else if (property === 'height') {
        value = Math.max(5, Math.min(value, label.height - element.y));
      }
    }
    
    if (property === 'fontSize') {
      value = Math.max(6, Math.min(24, Number(value)));
    }
    
    console.log(`Valor ajustado para os limites: ${value}`);
    
    label.elements[elementIndex] = {
      ...label.elements[elementIndex],
      [property]: value
    };
    
    console.log(`Elemento atualizado:`, label.elements[elementIndex]);
    
    setLabels(updatedLabels);
  };
  
  /**
   * Define o alinhamento de um elemento
   */
  const handleSetAlignment = (elementId: string | null, alignment: string) => {
    if (!elementId) {
      console.log("Não é possível atualizar alinhamento: ID do elemento é nulo");
      return;
    }
    
    console.log(`Definindo alinhamento do elemento ${elementId} para ${alignment}`);
    handleUpdateElement(elementId, 'align', alignment);
  };

  return {
    // Estado
    elements,
    
    // Funções
    handleAddElement,
    handleDeleteElement,
    handleUpdateElement,
    handleSetAlignment
  };
}
