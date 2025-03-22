
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Move,
  Type,
  Ruler,
  Maximize
} from "lucide-react";
import { LabelElement } from "./types";

interface ElementPanelProps {
  elements: { id: string; name: string }[];
  selectedElement: string | null;
  selectedLabelId: number | null;
  labels: any[];
  handleAddElement: (type: string) => string;
  handleDeleteElement: (elementId: string | null) => void;
  handleUpdateElement: (elementId: string | null, property: string, value: any) => void;
  handleSetAlignment: (elementId: string | null, alignment: string) => void;
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
  const [selectedElementData, setSelectedElementData] = useState<LabelElement | null>(null);
  
  // Atualizar dados do elemento quando um elemento é selecionado
  useEffect(() => {
    console.log("ElementPanel: selectedElement mudou para", selectedElement);
    console.log("ElementPanel: selectedLabelId é", selectedLabelId);
    
    if (selectedElement && selectedLabelId !== null) {
      const label = labels.find(l => l.id === selectedLabelId);
      if (label) {
        const element = label.elements.find((el: any) => el.id === selectedElement);
        if (element) {
          console.log("ElementPanel: Elemento encontrado", element);
          setSelectedElementData(element);
        } else {
          console.log("ElementPanel: Elemento não encontrado");
          setSelectedElementData(null);
        }
      } else {
        console.log("ElementPanel: Etiqueta não encontrada");
        setSelectedElementData(null);
      }
    } else {
      console.log("ElementPanel: Nenhum elemento selecionado");
      setSelectedElementData(null);
    }
  }, [selectedElement, selectedLabelId, labels]);

  // Função para adicionar um elemento e selecioná-lo automaticamente
  const addElement = (type: string) => {
    console.log("ElementPanel: Adicionando elemento do tipo", type);
    const newElementId = handleAddElement(type);
    console.log("ElementPanel: Novo elemento criado com ID", newElementId);
  };

  // Função auxiliar para renderizar o nome legível do tipo de elemento
  const getElementTypeName = (type: string) => {
    switch (type) {
      case "nome": return "Nome do Produto";
      case "codigo": return "Código de Barras";
      case "preco": return "Preço";
      default: return type;
    }
  };

  // Renderizar painel vazio se nenhuma etiqueta estiver selecionada
  if (selectedLabelId === null) {
    return (
      <div className="space-y-4 p-2">
        <div className="text-center text-sm text-muted-foreground py-6">
          Selecione uma etiqueta primeiro
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Adicionar Elementos</h3>
        <div className="grid grid-cols-3 gap-2">
          {elements.map(element => {
            // Verificar se o elemento já existe na etiqueta selecionada
            const labelIndex = labels.findIndex(l => l.id === selectedLabelId);
            if (labelIndex === -1) return null;
            
            const elementExists = labels[labelIndex].elements.some(
              (el: any) => el.type === element.id
            );
            
            return (
              <Button
                key={element.id}
                variant={elementExists ? "outline" : "default"}
                size="sm"
                onClick={() => addElement(element.id)}
                disabled={elementExists}
                className="text-xs h-auto py-1.5"
              >
                {element.name}
              </Button>
            );
          })}
        </div>
      </div>

      {selectedElementData ? (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Editar {getElementTypeName(selectedElementData.type)}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteElement(selectedElement)}
              className="h-8 w-8 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {/* Posição X e Y */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs flex items-center">
                  <Move className="h-3 w-3 mr-1" /> Posição X (mm)
                </Label>
                <Input
                  type="number"
                  value={selectedElementData.x}
                  onChange={(e) => {
                    console.log("ElementPanel: Alterando x para", e.target.value);
                    handleUpdateElement(
                      selectedElement,
                      "x",
                      Number(e.target.value)
                    );
                  }}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center">
                  <Move className="h-3 w-3 mr-1" /> Posição Y (mm)
                </Label>
                <Input
                  type="number"
                  value={selectedElementData.y}
                  onChange={(e) => {
                    console.log("ElementPanel: Alterando y para", e.target.value);
                    handleUpdateElement(
                      selectedElement,
                      "y",
                      Number(e.target.value)
                    );
                  }}
                  className="h-8"
                />
              </div>
            </div>

            {/* Largura e Altura */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs flex items-center">
                  <Ruler className="h-3 w-3 mr-1" /> Largura (mm)
                </Label>
                <Input
                  type="number"
                  value={selectedElementData.width}
                  onChange={(e) => {
                    console.log("ElementPanel: Alterando largura para", e.target.value);
                    handleUpdateElement(
                      selectedElement,
                      "width",
                      Number(e.target.value)
                    );
                  }}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center">
                  <Maximize className="h-3 w-3 mr-1" /> Altura (mm)
                </Label>
                <Input
                  type="number"
                  value={selectedElementData.height}
                  onChange={(e) => {
                    console.log("ElementPanel: Alterando altura para", e.target.value);
                    handleUpdateElement(
                      selectedElement,
                      "height",
                      Number(e.target.value)
                    );
                  }}
                  className="h-8"
                />
              </div>
            </div>

            {/* Tamanho da Fonte */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center">
                <Type className="h-3 w-3 mr-1" /> Tamanho da Fonte (pt)
              </Label>
              <Input
                type="number"
                value={selectedElementData.fontSize}
                onChange={(e) => {
                  console.log("ElementPanel: Alterando fonte para", e.target.value);
                  handleUpdateElement(
                    selectedElement,
                    "fontSize",
                    Number(e.target.value)
                  );
                }}
                className="h-8"
              />
            </div>

            {/* Alinhamento */}
            <div className="space-y-1">
              <Label className="text-xs">Alinhamento</Label>
              <div className="flex">
                <Button
                  type="button"
                  variant={selectedElementData.align === "left" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    console.log("ElementPanel: Alterando alinhamento para left");
                    handleSetAlignment(selectedElement, "left");
                  }}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={selectedElementData.align === "center" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    console.log("ElementPanel: Alterando alinhamento para center");
                    handleSetAlignment(selectedElement, "center");
                  }}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={selectedElementData.align === "right" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    console.log("ElementPanel: Alterando alinhamento para right");
                    handleSetAlignment(selectedElement, "right");
                  }}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground py-4 border-t">
          Selecione um elemento para editar
        </div>
      )}
    </div>
  );
}
