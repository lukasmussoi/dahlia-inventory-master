
import { useState } from 'react';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { CampoEtiqueta } from "@/types/etiqueta";

interface EtiquetaEditorProps {
  campos: CampoEtiqueta[];
  largura: number;
  altura: number;
  onCamposChange: (campos: CampoEtiqueta[]) => void;
}

function DraggableCampo({ campo }: { campo: CampoEtiqueta }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: campo.tipo,
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className="cursor-move p-2 bg-white border rounded shadow-sm"
      style={style}
    >
      {campo.tipo === 'nome' ? 'Nome do Produto' :
       campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
    </div>
  );
}

export function EtiquetaEditor({ campos, largura, altura, onCamposChange }: EtiquetaEditorProps) {
  const [warning, setWarning] = useState<string | null>(null);
  const { setNodeRef } = useDroppable({
    id: 'etiqueta-area',
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const campoIndex = campos.findIndex(c => c.tipo === active.id);
    
    if (campoIndex === -1) return;

    const novosCampos = [...campos];
    const campo = novosCampos[campoIndex];
    
    // Calcular nova posição
    const novoX = campo.x + (delta?.x || 0);
    const novoY = campo.y + (delta?.y || 0);
    
    // Validar limites
    if (novoX < 0 || novoX + campo.largura > largura || 
        novoY < 0 || novoY + campo.altura > altura) {
      setWarning("O elemento não pode ultrapassar os limites da etiqueta");
      return;
    }
    
    // Atualizar posição
    novosCampos[campoIndex] = {
      ...campo,
      x: novoX,
      y: novoY,
    };
    
    setWarning(null);
    onCamposChange(novosCampos);
  };

  return (
    <div className="space-y-4">
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4">
          <div className="w-48 space-y-2 p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Elementos Disponíveis</h3>
            {campos.map(campo => (
              <DraggableCampo key={campo.tipo} campo={campo} />
            ))}
          </div>
          
          <div 
            ref={setNodeRef}
            className="flex-1 relative bg-white border rounded"
            style={{
              width: `${largura * 2}px`,
              height: `${altura * 2}px`,
              backgroundSize: '10px 10px',
              backgroundImage: 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)'
            }}
          >
            {campos.map(campo => (
              <div
                key={campo.tipo}
                className="absolute border border-dashed border-gray-400 p-1"
                style={{
                  left: campo.x * 2,
                  top: campo.y * 2,
                  width: campo.largura * 2,
                  height: campo.altura * 2,
                }}
              >
                <div className="text-xs truncate">
                  {campo.tipo === 'nome' ? 'Nome do Produto' :
                   campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DndContext>

      {warning && (
        <Alert variant="warning" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
