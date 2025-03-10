
import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Type, 
  Barcode, 
  DollarSign, 
  Tag, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  BringToFront,
  SendToBack,
} from "lucide-react";

// Fator de escala para visualização
const SCALE_FACTOR = 3;

interface CampoEtiqueta {
  type: string;
  text?: string;
  left: number;
  top: number;
  width: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill?: string;
  textAlign?: string;
  barcodeType?: string;
}

interface LabelCanvasProps {
  width: number;
  height: number;
  campos: CampoEtiqueta[];
  onUpdate: (campos: CampoEtiqueta[]) => void;
}

export function LabelCanvas({ width, height, campos, onUpdate }: LabelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedElement, setSelectedElement] = useState<fabric.Object | null>(null);
  const [activeTab, setActiveTab] = useState("text");

  // Inicializar o canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Limpar canvas existente se houver
    if (canvas) {
      canvas.dispose();
    }

    // Criar novo canvas
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: width * SCALE_FACTOR,
      height: height * SCALE_FACTOR,
      backgroundColor: "#fff",
      selection: true,
    });

    // Adicionar borda para visualizar limites
    const border = new fabric.Rect({
      width: width * SCALE_FACTOR,
      height: height * SCALE_FACTOR,
      left: 0,
      top: 0,
      fill: "transparent",
      stroke: "#ddd",
      strokeWidth: 1,
      selectable: false,
      evented: false,
    });
    fabricCanvas.add(border);

    // Configurar manipulação de seleção
    fabricCanvas.on("selection:created", (e: any) => {
      setSelectedElement(e.selected?.[0] || null);
    });

    fabricCanvas.on("selection:updated", (e: any) => {
      setSelectedElement(e.selected?.[0] || null);
    });

    fabricCanvas.on("selection:cleared", () => {
      setSelectedElement(null);
    });

    // Salvar canvas
    setCanvas(fabricCanvas);

    // Limpar ao desmontar
    return () => {
      fabricCanvas.dispose();
    };
  }, [width, height]);

  // Carregar campos salvos quando o canvas estiver pronto
  useEffect(() => {
    if (!canvas || !campos || !Array.isArray(campos)) return;

    // Limpar canvas (exceto a borda)
    const borderObject = canvas.getObjects()[0];
    canvas.clear();
    if (borderObject) canvas.add(borderObject);

    // Carregar objetos salvos
    try {
      campos.forEach((campo) => {
        if (campo.type === "text") {
          const text = new fabric.Textbox(campo.text || "", {
            left: (campo.left || 10) * SCALE_FACTOR,
            top: (campo.top || 10) * SCALE_FACTOR,
            width: (campo.width || 100) * SCALE_FACTOR,
            fontSize: (campo.fontSize || 12) * SCALE_FACTOR / 2,
            fontFamily: campo.fontFamily || "Arial",
            fill: campo.fill || "#000",
            textAlign: campo.textAlign || "left",
          });
          canvas.add(text);
        } else if (campo.type === "barcode") {
          // Placeholder para código de barras
          const barcode = new fabric.Rect({
            left: (campo.left || 10) * SCALE_FACTOR,
            top: (campo.top || 10) * SCALE_FACTOR,
            width: (campo.width || 80) * SCALE_FACTOR,
            height: (campo.height || 20) * SCALE_FACTOR,
            fill: "#f0f0f0",
            stroke: "#999",
          });
          
          const text = new fabric.Text("CÓDIGO DE BARRAS", {
            left: (campo.left || 10) * SCALE_FACTOR,
            top: ((campo.top || 10) + (campo.height || 20) / 2) * SCALE_FACTOR,
            fontSize: 10 * SCALE_FACTOR / 2,
            originX: "left",
            originY: "center",
          });
          
          const group = new fabric.Group([barcode, text], {
            left: (campo.left || 10) * SCALE_FACTOR,
            top: (campo.top || 10) * SCALE_FACTOR,
            subTargetCheck: false,
          });
          
          canvas.add(group);
        } else if (campo.type === "price") {
          const price = new fabric.Textbox(campo.text || "R$ 0,00", {
            left: (campo.left || 10) * SCALE_FACTOR,
            top: (campo.top || 10) * SCALE_FACTOR,
            width: (campo.width || 100) * SCALE_FACTOR,
            fontSize: (campo.fontSize || 14) * SCALE_FACTOR / 2,
            fontFamily: campo.fontFamily || "Arial",
            fontWeight: campo.fontWeight || "bold",
            fill: campo.fill || "#000",
            textAlign: campo.textAlign || "left",
          });
          canvas.add(price);
        } else if (campo.type === "sku") {
          const sku = new fabric.Textbox(campo.text || "SKU123", {
            left: (campo.left || 10) * SCALE_FACTOR,
            top: (campo.top || 10) * SCALE_FACTOR,
            width: (campo.width || 100) * SCALE_FACTOR,
            fontSize: (campo.fontSize || 10) * SCALE_FACTOR / 2,
            fontFamily: campo.fontFamily || "Arial",
            fill: campo.fill || "#666",
            textAlign: campo.textAlign || "left",
          });
          canvas.add(sku);
        }
      });

      canvas.renderAll();
    } catch (error) {
      console.error("Erro ao carregar objetos salvos:", error);
    }
  }, [canvas, campos]);

  // Atualizar dados dos campos quando o canvas for modificado
  useEffect(() => {
    if (!canvas) return;

    const handleObjectModified = () => {
      const objects = canvas.getObjects().slice(1); // Ignorar a borda
      
      const updatedCampos = objects.map(obj => {
        // Converter de volta à escala real
        const baseProps = {
          left: obj.left ? obj.left / SCALE_FACTOR : 0,
          top: obj.top ? obj.top / SCALE_FACTOR : 0,
          width: obj.width ? obj.width / SCALE_FACTOR : 0,
          height: obj.height ? obj.height / SCALE_FACTOR : 0,
        };

        if (obj instanceof fabric.Textbox) {
          return {
            type: obj.get("precoFlag") ? "price" : 
                  obj.get("skuFlag") ? "sku" : "text",
            text: obj.text,
            ...baseProps,
            fontSize: obj.fontSize ? obj.fontSize / (SCALE_FACTOR / 2) : 12,
            fontFamily: obj.fontFamily,
            fill: obj.fill,
            textAlign: obj.textAlign,
            fontWeight: obj.fontWeight,
          };
        } else if (obj instanceof fabric.Group) {
          // É um código de barras
          return {
            type: "barcode",
            ...baseProps,
            barcodeType: obj.get("barcodeType") || "CODE128",
          };
        }
        
        return null;
      }).filter(Boolean) as CampoEtiqueta[];

      onUpdate(updatedCampos);
    };

    canvas.on("object:modified", handleObjectModified);
    canvas.on("object:added", handleObjectModified);
    canvas.on("object:removed", handleObjectModified);

    return () => {
      canvas.off("object:modified", handleObjectModified);
      canvas.off("object:added", handleObjectModified);
      canvas.off("object:removed", handleObjectModified);
    };
  }, [canvas, onUpdate]);

  // Adicionar elemento de texto
  const addText = () => {
    if (!canvas) return;
    
    const text = new fabric.Textbox("Nome do Produto", {
      left: 10 * SCALE_FACTOR,
      top: 10 * SCALE_FACTOR,
      width: 100 * SCALE_FACTOR,
      fontSize: 12 * SCALE_FACTOR / 2,
      fontFamily: "Arial",
      fill: "#000",
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    setSelectedElement(text);
  };

  // Adicionar código de barras
  const addBarcode = () => {
    if (!canvas) return;
    
    // Placeholder para código de barras
    const barcode = new fabric.Rect({
      width: 80 * SCALE_FACTOR,
      height: 20 * SCALE_FACTOR,
      fill: "#f0f0f0",
      stroke: "#999",
    });
    
    const text = new fabric.Text("CÓDIGO DE BARRAS", {
      fontSize: 10 * SCALE_FACTOR / 2,
      originX: "center",
      originY: "center",
      left: 40 * SCALE_FACTOR,
      top: 10 * SCALE_FACTOR,
    });
    
    const group = new fabric.Group([barcode, text], {
      left: 10 * SCALE_FACTOR,
      top: 30 * SCALE_FACTOR,
      subTargetCheck: false,
    });
    
    // Correção: apenas um argumento para o método set
    group.set("barcodeType", "CODE128");
    
    canvas.add(group);
    canvas.setActiveObject(group);
    setSelectedElement(group);
  };

  // Adicionar preço
  const addPrice = () => {
    if (!canvas) return;
    
    const price = new fabric.Textbox("R$ 99,90", {
      left: 10 * SCALE_FACTOR,
      top: 60 * SCALE_FACTOR,
      width: 80 * SCALE_FACTOR,
      fontSize: 14 * SCALE_FACTOR / 2,
      fontFamily: "Arial",
      fontWeight: "bold",
      fill: "#000",
      textAlign: "right",
    });
    
    // Correção: apenas um argumento para o método set
    price.set("precoFlag", true);
    
    canvas.add(price);
    canvas.setActiveObject(price);
    setSelectedElement(price);
  };

  // Adicionar SKU
  const addSku = () => {
    if (!canvas) return;
    
    const sku = new fabric.Textbox("SKU123", {
      left: 10 * SCALE_FACTOR,
      top: 80 * SCALE_FACTOR,
      width: 80 * SCALE_FACTOR,
      fontSize: 10 * SCALE_FACTOR / 2,
      fontFamily: "Arial",
      fill: "#666",
    });
    
    // Correção: apenas um argumento para o método set
    sku.set("skuFlag", true);
    
    canvas.add(sku);
    canvas.setActiveObject(sku);
    setSelectedElement(sku);
  };

  // Remover elemento selecionado
  const removeSelected = () => {
    if (!canvas || !selectedElement) return;
    canvas.remove(selectedElement);
    setSelectedElement(null);
  };

  // Mover elemento para frente
  const bringForward = () => {
    if (!canvas || !selectedElement) return;
    canvas.bringForward(selectedElement);
  };

  // Mover elemento para trás
  const sendBackward = () => {
    if (!canvas || !selectedElement) return;
    canvas.sendBackward(selectedElement);
  };

  // Mover elemento para cima
  const moveUp = () => {
    if (!canvas || !selectedElement) return;
    selectedElement.set({
      top: (selectedElement.top || 0) - 5,
    });
    canvas.renderAll();
  };

  // Mover elemento para baixo
  const moveDown = () => {
    if (!canvas || !selectedElement) return;
    selectedElement.set({
      top: (selectedElement.top || 0) + 5,
    });
    canvas.renderAll();
  };

  // Mover elemento para esquerda
  const moveLeft = () => {
    if (!canvas || !selectedElement) return;
    selectedElement.set({
      left: (selectedElement.left || 0) - 5,
    });
    canvas.renderAll();
  };

  // Mover elemento para direita
  const moveRight = () => {
    if (!canvas || !selectedElement) return;
    selectedElement.set({
      left: (selectedElement.left || 0) + 5,
    });
    canvas.renderAll();
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="text" className="flex gap-2 items-center">
                <Type className="h-4 w-4" />
                Texto
              </TabsTrigger>
              <TabsTrigger value="barcode" className="flex gap-2 items-center">
                <Barcode className="h-4 w-4" />
                Código de Barras
              </TabsTrigger>
              <TabsTrigger value="price" className="flex gap-2 items-center">
                <DollarSign className="h-4 w-4" />
                Preço
              </TabsTrigger>
              <TabsTrigger value="sku" className="flex gap-2 items-center">
                <Tag className="h-4 w-4" />
                SKU
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4 flex flex-wrap gap-2">
            {activeTab === "text" && (
              <Button onClick={addText} variant="outline" size="sm">
                <Type className="h-4 w-4 mr-2" />
                Adicionar Texto
              </Button>
            )}
            
            {activeTab === "barcode" && (
              <Button onClick={addBarcode} variant="outline" size="sm">
                <Barcode className="h-4 w-4 mr-2" />
                Adicionar Código de Barras
              </Button>
            )}
            
            {activeTab === "price" && (
              <Button onClick={addPrice} variant="outline" size="sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Adicionar Preço
              </Button>
            )}
            
            {activeTab === "sku" && (
              <Button onClick={addSku} variant="outline" size="sm">
                <Tag className="h-4 w-4 mr-2" />
                Adicionar SKU
              </Button>
            )}
            
            {selectedElement && (
              <>
                <Button 
                  onClick={removeSelected} 
                  variant="outline" 
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
                
                <Button onClick={bringForward} variant="outline" size="sm">
                  <BringToFront className="h-4 w-4 mr-2" />
                  Trazer para Frente
                </Button>
                
                <Button onClick={sendBackward} variant="outline" size="sm">
                  <SendToBack className="h-4 w-4 mr-2" />
                  Enviar para Trás
                </Button>
                
                <div className="flex gap-1">
                  <Button onClick={moveUp} variant="outline" size="sm" className="p-2">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button onClick={moveDown} variant="outline" size="sm" className="p-2">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button onClick={moveLeft} variant="outline" size="sm" className="p-2">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button onClick={moveRight} variant="outline" size="sm" className="p-2">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="border rounded-lg p-4 flex justify-center">
        <div
          style={{
            border: "1px solid #ccc",
            display: "inline-block",
            margin: "0 auto",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>
      
      <div className="text-sm text-gray-500 text-center">
        <p>Tamanho real da etiqueta: {width}mm x {height}mm</p>
        <p>Arraste os elementos para posicioná-los na etiqueta</p>
      </div>
    </div>
  );
}
