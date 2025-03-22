
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  compact?: boolean;
}

export default function ZoomControls({ 
  zoomLevel, 
  onZoomIn, 
  onZoomOut, 
  onResetZoom,
  compact = false
}: ZoomControlsProps) {
  const percentage = Math.round(zoomLevel * 100);
  
  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size={compact ? "icon" : "sm"} 
              onClick={onZoomOut}
              className={compact ? "h-6 w-6" : ""}
            >
              <ZoomOut className={compact ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Diminuir (-)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size={compact ? "icon" : "sm"} 
              onClick={onResetZoom}
              className={compact ? "h-6 w-6" : ""}
            >
              <span className={compact ? "text-xs" : "text-sm"}>
                {percentage}%
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Resetar zoom (0)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size={compact ? "icon" : "sm"} 
              onClick={onZoomIn}
              className={compact ? "h-6 w-6" : ""}
            >
              <ZoomIn className={compact ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Aumentar (+)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
