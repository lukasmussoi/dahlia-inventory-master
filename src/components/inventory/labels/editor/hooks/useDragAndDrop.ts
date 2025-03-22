
import { useRef } from "react";

/**
 * Hook para gerenciar o arrastar e soltar de elementos e etiquetas
 */
export function useDragAndDrop(
  editorRef: React.RefObject<HTMLDivElement>,
  labels: any[],
  setLabels: React.Dispatch<React.SetStateAction<any[]>>,
  selectedLabelId: number | null,
  zoom: number,
  snapToGridValue: (value: number) => number
) {
  const dragRef = useRef({ 
    isDragging: false, 
    type: null as any, 
    id: null as any, 
    startX: 0, 
    startY: 0, 
    offsetX: 0, 
    offsetY: 0,
    elementInitialBounds: { x: 0, y: 0, width: 0, height: 0 }, // Armazenar dimensões iniciais do elemento
    labelInitialBounds: { x: 0, y: 0, width: 0, height: 0 }    // Armazenar dimensões iniciais da etiqueta
  });

  /**
   * Inicia o arrastar de um elemento ou etiqueta
   */
  const handleStartDrag = (
    e: React.MouseEvent, 
    type: "element" | "label", 
    id: string | number, 
    x: number, 
    y: number
  ) => {
    if (!editorRef.current) return;
    e.stopPropagation();
    
    const rect = editorRef.current.getBoundingClientRect();
    
    // Armazenar informações adicionais dependendo do tipo
    if (type === "element" && selectedLabelId !== null) {
      // Encontrar o elemento e a etiqueta
      const label = labels.find(l => l.id === selectedLabelId);
      if (!label) return;
      
      const element = label.elements.find(el => el.id === id);
      if (!element) return;
      
      // Armazenar as dimensões iniciais
      dragRef.current = {
        isDragging: true, 
        type, 
        id, 
        startX: x, 
        startY: y, 
        offsetX: e.clientX - rect.left, 
        offsetY: e.clientY - rect.top,
        elementInitialBounds: {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height
        },
        labelInitialBounds: {
          x: label.x,
          y: label.y,
          width: label.width,
          height: label.height
        }
      };
    } else if (type === "label") {
      // Encontrar a etiqueta
      const label = labels.find(l => l.id === id);
      if (!label) return;
      
      // Armazenar informações da etiqueta
      dragRef.current = {
        isDragging: true, 
        type, 
        id, 
        startX: x, 
        startY: y, 
        offsetX: e.clientX - rect.left, 
        offsetY: e.clientY - rect.top,
        elementInitialBounds: { x: 0, y: 0, width: 0, height: 0 },
        labelInitialBounds: {
          x: label.x,
          y: label.y,
          width: label.width,
          height: label.height
        }
      };
    }
  };

  /**
   * Processa o arrastar
   */
  const handleDrag = (e: React.MouseEvent) => {
    if (!dragRef.current.isDragging || !editorRef.current) return;
    e.preventDefault();
    
    const rect = editorRef.current.getBoundingClientRect();
    const zoomFactor = zoom / 100;
    
    // Calcular a nova posição
    const currentX = (e.clientX - rect.left) / zoomFactor;
    const currentY = (e.clientY - rect.top) / zoomFactor;
    
    // Aplicar o snap to grid se ativado
    const x = snapToGridValue(currentX);
    const y = snapToGridValue(currentY);
    
    const updatedLabels = [...labels];
    
    if (dragRef.current.type === "element") {
      const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
      if (labelIndex === -1) return;
      
      const label = updatedLabels[labelIndex];
      const elementIndex = label.elements.findIndex(el => el.id === dragRef.current.id);
      if (elementIndex === -1) return;
      
      const element = label.elements[elementIndex];
      const initialBounds = dragRef.current.elementInitialBounds;
      const labelBounds = dragRef.current.labelInitialBounds;
      
      // Calcular o deslocamento em relação à posição inicial
      const deltaX = x - dragRef.current.offsetX / zoomFactor;
      const deltaY = y - dragRef.current.offsetY / zoomFactor;
      
      // Calcular a nova posição do elemento
      let newX = initialBounds.x + deltaX;
      let newY = initialBounds.y + deltaY;
      
      // Limitar o elemento dentro dos limites da etiqueta
      newX = Math.max(0, Math.min(newX, label.width - element.width));
      newY = Math.max(0, Math.min(newY, label.height - element.height));
      
      // Atualizar a posição do elemento
      label.elements[elementIndex] = {
        ...element,
        x: newX,
        y: newY
      };
    } else if (dragRef.current.type === "label") {
      const labelIndex = updatedLabels.findIndex(l => l.id === dragRef.current.id);
      if (labelIndex === -1) return;
      
      const initialBounds = dragRef.current.labelInitialBounds;
      const pageWidth = rect.width / zoomFactor;
      const pageHeight = rect.height / zoomFactor;
      
      // Calcular o deslocamento em relação à posição inicial
      const deltaX = x - dragRef.current.offsetX / zoomFactor;
      const deltaY = y - dragRef.current.offsetY / zoomFactor;
      
      // Calcular a nova posição da etiqueta
      let newX = initialBounds.x + deltaX;
      let newY = initialBounds.y + deltaY;
      
      // Limitar a etiqueta dentro dos limites da página
      const label = updatedLabels[labelIndex];
      newX = Math.max(0, Math.min(newX, pageWidth - label.width));
      newY = Math.max(0, Math.min(newY, pageHeight - label.height));
      
      // Atualizar a posição da etiqueta
      updatedLabels[labelIndex] = {
        ...label,
        x: newX,
        y: newY
      };
    }
    
    setLabels(updatedLabels);
  };

  /**
   * Finaliza o arrastar
   */
  const handleEndDrag = () => {
    dragRef.current.isDragging = false;
  };

  return {
    dragRef,
    handleStartDrag,
    handleDrag,
    handleEndDrag
  };
}
