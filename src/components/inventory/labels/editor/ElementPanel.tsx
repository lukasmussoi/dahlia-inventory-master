
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { ElementType, LabelElement } from "./types";
import { toast } from "sonner";

interface ElementPanelProps {
  elements: ElementType[];
  selectedElement: string | null;
  selectedLabelId: number | null;
  labels: any[];
  handleAddElement: (elementType: string) => void;
  handleDeleteElement: () => void;
  handleUpdateElement: (property: string, value: any) => void;
  handleSetAlignment: (alignment: string) => void;
}

export function ElementPanel({
  elements,
  selectedElement,
  selectedLabelId,
  labels,
  handleAddElement,
  handleDeleteElement,
  handleUpdateElement,
  handleSetAlignment
}: ElementPanelProps) {
  const getSelectedElementDetails = () => {
    if (!selectedElement || selectedLabelId === null) return null;
    const label = labels.find(l => l.id === selectedLabelId);
    if (!label) return null;
    return label.elements.find((e: LabelElement) => e.id === selectedElement);
  };

  const getElementName = (type: string) => {
    switch (type) {
      case "nome": return "Nome do Produto";
      case "codigo": return "Código de Barras";
      case "preco": return "Preço";
      default: return type;
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium mb-3">Elementos Disponíveis</h3>
      
      {elements.map(element => (
        <Card 
          key={element.id}
          className="p-2 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => handleAddElement(element.id)}
        >
          <div className="text-sm font-medium mb-1">{element.name}</div>
          <div className="text-xs text-muted-foreground">
            Clique para adicionar à etiqueta
          </div>
        </Card>
      ))}
      
      {selectedElement && (
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Propriedades do Elemento</h3>
            <Button
              variant="destructive"
              size="sm"
              className="h-6 px-2"
              onClick={handleDeleteElement}
            >
              <Trash className="h-3 w-3 mr-1" />
              <span className="text-xs">Remover</span>
            </Button>
          </div>
          
          {getSelectedElementDetails() && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs" htmlFor="element-type">Tipo</Label>
                <div className="text-sm font-medium" id="element-type">
                  {getElementName(getSelectedElementDetails()!.type)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs" htmlFor="element-x">Posição X</Label>
                  <Input
                    id="element-x"
                    type="number"
                    className="h-7 text-sm"
                    value={getSelectedElementDetails()!.x}
                    onChange={(e) => handleUpdateElement('x', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor="element-y">Posição Y</Label>
                  <Input
                    id="element-y"
                    type="number"
                    className="h-7 text-sm"
                    value={getSelectedElementDetails()!.y}
                    onChange={(e) => handleUpdateElement('y', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs" htmlFor="element-width">Largura</Label>
                  <Input
                    id="element-width"
                    type="number"
                    className="h-7 text-sm"
                    value={getSelectedElementDetails()!.width}
                    onChange={(e) => handleUpdateElement('width', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor="element-height">Altura</Label>
                  <Input
                    id="element-height"
                    type="number"
                    className="h-7 text-sm"
                    value={getSelectedElementDetails()!.height}
                    onChange={(e) => handleUpdateElement('height', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs" htmlFor="element-font-size">Tamanho da Fonte</Label>
                <Input
                  id="element-font-size"
                  type="number"
                  className="h-7 text-sm"
                  value={getSelectedElementDetails()!.fontSize}
                  onChange={(e) => handleUpdateElement('fontSize', e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-xs mb-1 block">Alinhamento</Label>
                <div className="flex items-center space-x-1">
                  <Button
                    variant={getSelectedElementDetails()!.align === "left" ? "default" : "outline"}
                    size="sm"
                    className="h-7 flex-1"
                    onClick={() => handleSetAlignment("left")}
                  >
                    <AlignLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={getSelectedElementDetails()!.align === "center" ? "default" : "outline"}
                    size="sm"
                    className="h-7 flex-1"
                    onClick={() => handleSetAlignment("center")}
                  >
                    <AlignCenter className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={getSelectedElementDetails()!.align === "right" ? "default" : "outline"}
                    size="sm"
                    className="h-7 flex-1"
                    onClick={() => handleSetAlignment("right")}
                  >
                    <AlignRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
