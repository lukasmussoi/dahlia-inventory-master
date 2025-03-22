
import { cn } from "@/lib/utils";
import { RefObject } from "react";
import { LabelElement, LabelType } from "./types";

interface VisualEditorProps {
  editorRef: RefObject<HTMLDivElement>;
  pageSize: { width: number; height: number };
  zoom: number;
  showGrid: boolean;
  gridSize: number;
  pageMargins: { top: number; bottom: number; left: number; right: number };
  labels: LabelType[];
  selectedLabelId: number | null;
  selectedElement: string | null;
  handleDrag: (e: React.MouseEvent) => void;
  handleEndDrag: () => void;
  handleStartDrag: (e: React.MouseEvent, type: "element" | "label", id: string | number, x: number, y: number) => void;
  setSelectedLabelId: (id: number | null) => void;
  setSelectedElement: (id: string | null) => void;
}

export function VisualEditor({
  editorRef,
  pageSize,
  zoom,
  showGrid,
  gridSize,
  pageMargins,
  labels,
  selectedLabelId,
  selectedElement,
  handleDrag,
  handleEndDrag,
  handleStartDrag,
  setSelectedLabelId,
  setSelectedElement
}: VisualEditorProps) {
  const getElementPreview = (type: string) => {
    switch (type) {
      case "nome": return "Pingente Cristal";
      case "codigo": return "123456789";
      case "preco": return "R$ 99,90";
      default: return "Elemento";
    }
  };

  const handleElementClick = (e: React.MouseEvent, labelId: number, elementId: string) => {
    e.stopPropagation();
    console.log(`Clicou no elemento: ${elementId} da etiqueta: ${labelId}`);
    
    // Atualizar a etiqueta selecionada se necessário
    if (selectedLabelId !== labelId) {
      setSelectedLabelId(labelId);
    }
    
    // Atualizar o elemento selecionado
    setSelectedElement(elementId);
  };

  return (
    <div className="flex-1 p-4 overflow-auto bg-gray-100 dark:bg-gray-800/20">
      <div 
        className="relative bg-white dark:bg-gray-950 mx-auto border shadow"
        style={{
          width: pageSize.width * (zoom / 100),
          height: pageSize.height * (zoom / 100),
        }}
        ref={editorRef}
        onMouseMove={handleDrag}
        onMouseUp={handleEndDrag}
        onMouseLeave={handleEndDrag}
        onClick={() => {
          // Ao clicar em um espaço vazio, desselecionar elemento
          console.log("Clicou no fundo da página, limpando seleção de elemento");
          setSelectedElement(null);
        }}
      >
        {/* Grade */}
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundSize: `${gridSize * (zoom / 100)}px ${gridSize * (zoom / 100)}px`,
              backgroundImage: "linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)",
              opacity: 0.4
            }}
          />
        )}
        
        {/* Visualização das margens da página */}
        <div 
          className="absolute border border-dashed border-blue-300 pointer-events-none"
          style={{
            left: pageMargins.left * (zoom / 100),
            top: pageMargins.top * (zoom / 100),
            right: pageMargins.right * (zoom / 100),
            bottom: pageMargins.bottom * (zoom / 100),
            width: `calc(100% - ${(pageMargins.left + pageMargins.right) * (zoom / 100)}px)`,
            height: `calc(100% - ${(pageMargins.top + pageMargins.bottom) * (zoom / 100)}px)`,
          }}
        />
        
        {/* Etiquetas */}
        {labels.map(label => (
          <div 
            key={label.id}
            className={cn(
              "absolute border border-dashed cursor-move transition-all",
              selectedLabelId === label.id ? "border-primary border-2" : "border-gray-400"
            )}
            style={{
              left: label.x * (zoom / 100),
              top: label.y * (zoom / 100),
              width: label.width * (zoom / 100),
              height: label.height * (zoom / 100),
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Clicou na etiqueta: ${label.id}`);
              setSelectedLabelId(label.id);
              setSelectedElement(null);
            }}
            onMouseDown={(e) => handleStartDrag(e, "label", label.id, label.x, label.y)}
          >
            {/* Elementos da etiqueta */}
            {label.elements.map((element: LabelElement) => (
              <div
                key={element.id}
                className={cn(
                  "absolute border cursor-move transition-all",
                  selectedElement === element.id ? "border-primary-foreground bg-primary" : "border-gray-300 bg-gray-50"
                )}
                style={{
                  left: element.x * (zoom / 100),
                  top: element.y * (zoom / 100),
                  width: element.width * (zoom / 100),
                  height: element.height * (zoom / 100),
                }}
                onClick={(e) => handleElementClick(e, label.id, element.id)}
                onMouseDown={(e) => handleStartDrag(e, "element", element.id, element.x, element.y)}
              >
                <div 
                  className={cn(
                    "w-full h-full flex items-center overflow-hidden px-1",
                    selectedElement === element.id ? "text-primary-foreground" : "text-foreground"
                  )}
                  style={{
                    fontSize: element.fontSize * (zoom / 100),
                    textAlign: element.align as any
                  }}
                >
                  <div className="w-full truncate">
                    {getElementPreview(element.type)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Nome da etiqueta */}
            <div className="absolute -top-5 left-0 text-xs font-medium">
              {label.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
