
import { useState, useRef } from "react";
import { LabelType } from "../types";

/**
 * Hook para gerenciar o estado global do editor de etiquetas
 */
export function useEtiquetaState(initialData?: any) {
  // Estado geral do editor
  const [activeTab, setActiveTab] = useState("elementos");
  const [modelName, setModelName] = useState(initialData?.nome || "");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [zoom, setZoom] = useState(150);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(5);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ 
    isDragging: false, 
    type: null as any, 
    id: null as any, 
    startX: 0, 
    startY: 0, 
    offsetX: 0, 
    offsetY: 0 
  });

  return {
    // Estado básico
    activeTab,
    setActiveTab,
    modelName,
    setModelName,
    selectedElement,
    setSelectedElement,
    zoom,
    setZoom,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    isPreviewDialogOpen,
    setIsPreviewDialogOpen,
    previewPdfUrl,
    setPreviewPdfUrl,
    isGeneratingPdf,
    setIsGeneratingPdf,
    
    // Refs
    editorRef,
    dragRef
  };
}
