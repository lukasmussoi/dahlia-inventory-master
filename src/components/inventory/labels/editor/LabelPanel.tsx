
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Copy, LayoutGrid, Trash } from "lucide-react";
import { LabelType } from "./types";

interface LabelPanelProps {
  labels: LabelType[];
  selectedLabelId: number | null;
  setSelectedLabelId: (id: number | null) => void;
  setSelectedElement: (id: string | null) => void;
  handleAddLabel: () => void;
  handleDuplicateLabel: (id: number) => void;
  handleDeleteLabel: (id: number) => void;
  handleUpdateLabelName: (id: number, name: string) => void;
  handleUpdateLabelSize: (dimension: "width" | "height", value: number) => void;
  handleOptimizeLayout: () => void;
}

export function LabelPanel({
  labels,
  selectedLabelId,
  setSelectedLabelId,
  setSelectedElement,
  handleAddLabel,
  handleDuplicateLabel,
  handleDeleteLabel,
  handleUpdateLabelName,
  handleUpdateLabelSize,
  handleOptimizeLayout
}: LabelPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Etiquetas</h3>
        <Button
          variant="default"
          size="sm"
          className="h-7 px-2"
          onClick={handleAddLabel}
        >
          <Plus className="h-3 w-3 mr-1" />
          <span className="text-xs">Nova</span>
        </Button>
      </div>
      
      <div className="space-y-2">
        {labels.map((label) => (
          <Card 
            key={label.id}
            className={cn(
              "p-2 cursor-pointer",
              selectedLabelId === label.id ? "bg-primary/10 border-primary" : "hover:bg-accent"
            )}
            onClick={() => {
              setSelectedLabelId(label.id);
              setSelectedElement(null);
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium">{label.name}</div>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateLabel(label.id);
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLabel(label.id);
                  }}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {label.width} × {label.height} mm • {label.elements.length} elementos
            </div>
            
            {selectedLabelId === label.id && (
              <div className="mt-2 pt-2 border-t">
                <Label className="text-xs mb-1 block">Nome da Etiqueta</Label>
                <Input
                  value={label.name}
                  className="h-7 text-sm"
                  onChange={(e) => handleUpdateLabelName(label.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label className="text-xs mb-1 block">Largura (mm)</Label>
                    <Input
                      type="number"
                      className="h-7 text-sm"
                      value={label.width}
                      onChange={(e) => handleUpdateLabelSize("width", Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Altura (mm)</Label>
                    <Input
                      type="number"
                      className="h-7 text-sm"
                      value={label.height}
                      onChange={(e) => handleUpdateLabelSize("height", Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptimizeLayout();
                  }}
                >
                  <LayoutGrid className="h-3 w-3 mr-1" />
                  <span className="text-xs">Otimizar Layout</span>
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Importando o componente Plus que estava faltando
import { Plus } from "lucide-react";
