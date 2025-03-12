
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomLevel: number;
  className?: string;
}

export function ZoomControls({ onZoomIn, onZoomOut, onReset, zoomLevel, className }: ZoomControlsProps) {
  return (
    <div className={cn("flex items-center gap-2 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.preventDefault(); // Prevent form submission
          onZoomOut();
        }}
        title="Diminuir zoom (Atalho: -)"
        className="h-8 w-8 p-0"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <div className="text-sm font-medium min-w-[4rem] text-center">
        {Math.round(zoomLevel * 100)}%
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.preventDefault(); // Prevent form submission
          onZoomIn();
        }}
        title="Aumentar zoom (Atalho: +)"
        className="h-8 w-8 p-0"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.preventDefault(); // Prevent form submission
          onReset();
        }}
        title="Resetar zoom (Atalho: 0)"
        className="h-8 w-8 p-0"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
