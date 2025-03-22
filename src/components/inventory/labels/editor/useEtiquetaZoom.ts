
import { useState, useEffect, useCallback } from 'react';

export function useEtiquetaZoom(initialZoom = 1) {
  const [zoomLevel, setZoomLevel] = useState(initialZoom);
  
  const handleZoomIn = useCallback((amount = 0.25) => {
    setZoomLevel(prev => {
      const newZoom = Math.min(prev + amount, 5); // Maximum 500%
      console.log(`Zoom ajustado: ${newZoom.toFixed(2)}x`);
      return newZoom;
    });
  }, []);

  const handleZoomOut = useCallback((amount = 0.25) => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - amount, 0.25); // Minimum 25%
      console.log(`Zoom ajustado: ${newZoom.toFixed(2)}x`);
      return newZoom;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    console.log("Zoom resetado para 1x");
  }, []);

  // Aplicar zoom para ajustar à visualização
  const handleFitToView = useCallback((containerWidth: number, contentWidth: number, padding = 40) => {
    if (containerWidth && contentWidth) {
      const availableWidth = containerWidth - padding;
      const newZoom = availableWidth / contentWidth;
      // Limitar zoom para não ficar muito pequeno ou grande
      const limitedZoom = Math.min(Math.max(newZoom, 0.25), 2);
      setZoomLevel(limitedZoom);
      console.log(`Ajuste automático de zoom: ${limitedZoom.toFixed(2)}x`);
      return limitedZoom;
    }
    return 1;
  }, []);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Não aplicar atalhos se estiver em um input
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) return;
      
      if ((e.key === '=' || e.key === '+') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleZoomIn(0.25);
      } else if ((e.key === '-' || e.key === '_') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleZoomOut(0.25);
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  return {
    zoomLevel,
    setZoomLevel,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleFitToView
  };
}
