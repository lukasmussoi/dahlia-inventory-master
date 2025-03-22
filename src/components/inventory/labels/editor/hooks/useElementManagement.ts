
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
      defaultHeight: 15, 
      defaultFontSize: 8,
      defaultAlign: "left"
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
      return;
    }
    
    const labelIndex = labels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) return;
    
    // Verificar se o elemento já existe
    const elementExists = labels[labelIndex].elements.some((el: any) => el.type === elementType);
    if (elementExists) {
      toast.error(`Este elemento já foi adicionado na etiqueta`);
      return;
    }
    
    const elementTemplate = elements.find(e => e.id === elementType);
    if (!elementTemplate) return;
    
    const newElement = {
      id: `elemento-${elementType}-${Date.now()}`,
      type: elementType,
      x: 10,
      y: 10,
      width: elementTemplate.defaultWidth,
      height: elementTemplate.defaultHeight,
      fontSize: elementTemplate.defaultFontSize,
      align: elementTemplate.defaultAlign || "left"
    };
    
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
    if (!elementId || selectedLabelId === null) return;
    
    const updatedLabels = [...labels];
    const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) return;
    
    const elementIndex = updatedLabels[labelIndex].elements.findIndex((el: any) => el.id === elementId);
    if (elementIndex === -1) return;
    
    updatedLabels[labelIndex].elements.splice(elementIndex, 1);
    setLabels(updatedLabels);
    
    toast.success(`Elemento removido`);
  };
  
  /**
   * Atualiza um elemento
   */
  const handleUpdateElement = (elementId: string | null, property: string, value: any) => {
    if (!elementId || selectedLabelId === null) return;
    
    const updatedLabels = [...labels];
    const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
    if (labelIndex === -1) return;
    
    const label = updatedLabels[labelIndex];
    const elementIndex = label.elements.findIndex((el: any) => el.id === elementId);
    if (elementIndex === -1) return;
    
    // Garantir que os valores estão dentro dos limites
    if (property === 'x' || property === 'y' || property === 'width' || property === 'height') {
      value = Number(value);
      
      // Limites para x e width
      if (property === 'x') {
        value = Math.max(0, Math.min(value, label.width - label.elements[elementIndex].width));
      }
      else if (property === 'width') {
        value = Math.max(10, Math.min(value, label.width - label.elements[elementIndex].x));
      }
      
      // Limites para y e height
      if (property === 'y') {
        value = Math.max(0, Math.min(value, label.height - label.elements[elementIndex].height));
      }
      else if (property === 'height') {
        value = Math.max(5, Math.min(value, label.height - label.elements[elementIndex].y));
      }
    }
    
    if (property === 'fontSize') {
      value = Math.max(6, Math.min(24, Number(value)));
    }
    
    label.elements[elementIndex] = {
      ...label.elements[elementIndex],
      [property]: value
    };
    
    setLabels(updatedLabels);
  };
  
  /**
   * Define o alinhamento de um elemento
   */
  const handleSetAlignment = (elementId: string | null, alignment: string) => {
    if (!elementId) return;
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
