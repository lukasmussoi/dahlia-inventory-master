
import { useState, useEffect, useCallback } from 'react';

export function useEtiquetaZoom(initialZoom = 1) {
  const [zoomLevel, setZoomLevel] = useState(initialZoom);
  
  const handleZoomIn = useCallback((amount = 0.5) => {
    setZoomLevel(prev => Math.min(prev + amount, 5)); // Maximum 500%
  }, []);

  const handleZoomOut = useCallback((amount = 0.5) => {
    setZoomLevel(prev => Math.max(prev - amount, 0.3)); // Minimum 30%
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const handleZoomToFit = useCallback((containerWidth: number, containerHeight: number, objectWidth: number, objectHeight: number, padding = 20) => {
    const availableWidth = containerWidth - padding * 2;
    const availableHeight = containerHeight - padding * 2;
    
    // Calcular o fator de zoom para ajustar aos limites do container
    const widthRatio = availableWidth / objectWidth;
    const heightRatio = availableHeight / objectHeight;
    
    // Usar o menor dos dois para garantir que o objeto caiba completamente
    const newZoom = Math.min(widthRatio, heightRatio);
    
    // Limitar o zoom (opcional)
    setZoomLevel(Math.min(Math.max(newZoom, 0.3), 5));
  }, []);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement || 
          e.target instanceof HTMLSelectElement) return;
      
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        handleZoomIn(0.25);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut(0.25);
      } else if (e.key === '0') {
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
    handleZoomToFit
  };
}
