
import React from 'react';
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: (amount?: number) => void;
  onZoomOut: (amount?: number) => void;
  onResetZoom: () => void; // Adicionando propriedade obrigatória
}

export function ZoomControls({ zoomLevel, onZoomIn, onZoomOut, onResetZoom }: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onZoomOut()}
        title="Diminuir Zoom"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <div className="text-xs font-medium px-2 min-w-[60px] text-center">
        {Math.round(zoomLevel * 100)}%
      </div>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onZoomIn()}
        title="Aumentar Zoom"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onResetZoom}
        title="Resetar Zoom"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
