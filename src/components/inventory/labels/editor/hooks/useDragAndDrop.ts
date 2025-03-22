
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
    type: null as "element" | "label" | null, 
    id: null as string | number | null, 
    startX: 0, 
    startY: 0, 
    offsetX: 0, 
    offsetY: 0,
    elementInitialBounds: { x: 0, y: 0, width: 0, height: 0 }, 
    labelInitialBounds: { x: 0, y: 0, width: 0, height: 0 }
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
    
    console.log(`Iniciando arrasto de ${type} (ID: ${id}), posição inicial: ${x}, ${y}`);
    
    const rect = editorRef.current.getBoundingClientRect();
    
    // Armazenar informações adicionais dependendo do tipo
    if (type === "element" && selectedLabelId !== null) {
      // Encontrar o elemento e a etiqueta
      const label = labels.find(l => l.id === selectedLabelId);
      if (!label) {
        console.error("Etiqueta não encontrada para arrasto de elemento");
        return;
      }
      
      const element = label.elements.find(el => el.id === id);
      if (!element) {
        console.error("Elemento não encontrado para arrasto");
        return;
      }
      
      console.log("Elemento encontrado para arrasto:", element);
      
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
      if (!label) {
        console.error("Etiqueta não encontrada para arrasto");
        return;
      }
      
      console.log("Etiqueta encontrada para arrasto:", label);
      
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
    let newX, newY;
    
    if (dragRef.current.type === "element") {
      // Para elementos, calculamos o delta em relação à posição inicial do mouse
      newX = (e.clientX - rect.left) / zoomFactor;
      newY = (e.clientY - rect.top) / zoomFactor;
      
      // Ajustar pela posição inicial do mouse dentro do elemento
      const offsetXInElement = dragRef.current.offsetX / zoomFactor;
      const offsetYInElement = dragRef.current.offsetY / zoomFactor;
      
      // Calcular a posição real desejada do elemento
      newX = newX - offsetXInElement + dragRef.current.elementInitialBounds.x;
      newY = newY - offsetYInElement + dragRef.current.elementInitialBounds.y;
    } else {
      // Para etiquetas, calculamos diretamente
      newX = (e.clientX - rect.left) / zoomFactor;
      newY = (e.clientY - rect.top) / zoomFactor;
    }
    
    // Aplicar o snap to grid se ativado
    newX = snapToGridValue(newX);
    newY = snapToGridValue(newY);
    
    console.log(`Arrasto em progresso: nova posição calculada: ${newX}, ${newY}`);
    
    const updatedLabels = [...labels];
    
    if (dragRef.current.type === "element") {
      const labelIndex = updatedLabels.findIndex(l => l.id === selectedLabelId);
      if (labelIndex === -1) {
        console.error("Etiqueta não encontrada durante arrasto");
        return;
      }
      
      const label = updatedLabels[labelIndex];
      const elementIndex = label.elements.findIndex(el => el.id === dragRef.current.id);
      if (elementIndex === -1) {
        console.error("Elemento não encontrado durante arrasto");
        return;
      }
      
      const element = label.elements[elementIndex];
      
      // Limitar o elemento dentro dos limites da etiqueta
      newX = Math.max(0, Math.min(newX, label.width - element.width));
      newY = Math.max(0, Math.min(newY, label.height - element.height));
      
      console.log(`Movendo elemento para: ${newX}, ${newY} (dentro dos limites da etiqueta)`);
      
      // Atualizar a posição do elemento
      label.elements[elementIndex] = {
        ...element,
        x: newX,
        y: newY
      };
    } else if (dragRef.current.type === "label") {
      const labelIndex = updatedLabels.findIndex(l => l.id === dragRef.current.id);
      if (labelIndex === -1) {
        console.error("Etiqueta não encontrada durante arrasto");
        return;
      }
      
      const pageWidth = rect.width / zoomFactor;
      const pageHeight = rect.height / zoomFactor;
      
      // Calcular o deslocamento em relação à posição inicial
      const deltaX = newX - dragRef.current.offsetX / zoomFactor;
      const deltaY = newY - dragRef.current.offsetY / zoomFactor;
      
      // Calcular a nova posição da etiqueta com base no deslocamento
      const initialBounds = dragRef.current.labelInitialBounds;
      newX = initialBounds.x + deltaX;
      newY = initialBounds.y + deltaY;
      
      // Limitar a etiqueta dentro dos limites da página
      const label = updatedLabels[labelIndex];
      newX = Math.max(0, Math.min(newX, pageWidth - label.width));
      newY = Math.max(0, Math.min(newY, pageHeight - label.height));
      
      console.log(`Movendo etiqueta para: ${newX}, ${newY} (dentro dos limites da página)`);
      
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
    if (dragRef.current.isDragging) {
      console.log(`Finalizando arrasto de ${dragRef.current.type}`);
      dragRef.current.isDragging = false;
    }
  };

  return {
    dragRef,
    handleStartDrag,
    handleDrag,
    handleEndDrag
  };
}
