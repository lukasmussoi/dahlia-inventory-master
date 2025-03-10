
import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  AlertCircle, 
  MoveIcon,
  PanelLeftIcon,
  GripVertical
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { CampoEtiqueta } from "@/types/etiqueta";

interface EtiquetaEditorProps {
  campos: CampoEtiqueta[];
  largura: number;
  altura: number;
  onCamposChange: (campos: CampoEtiqueta[]) => void;
}

function DraggableCampo({ campo, index, onSelect }: { 
  campo: CampoEtiqueta; 
  index: number;
  onSelect: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `campo-${campo.tipo}-${index}`,
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
  } : undefined;

  const handleClick = () => {
    onSelect(index);
  };

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className="cursor-move p-2 bg-white border rounded shadow-sm flex items-center gap-2"
      style={style}
      onClick={handleClick}
    >
      <GripVertical className="h-4 w-4 text-gray-400" />
      {campo.tipo === 'nome' ? 'Nome do Produto' :
       campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
    </div>
  );
}

function ElementoPaleta({ tipo, onAdd }: { 
  tipo: 'nome' | 'codigo' | 'preco'; 
  onAdd: (tipo: 'nome' | 'codigo' | 'preco') => void;
}) {
  return (
    <div 
      className="cursor-pointer p-2 bg-white border rounded shadow-sm hover:bg-gray-50 flex items-center gap-2"
      onClick={() => onAdd(tipo)}
    >
      <GripVertical className="h-4 w-4 text-gray-400" />
      {tipo === 'nome' ? 'Nome do Produto' :
       tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
    </div>
  );
}

export function EtiquetaEditor({ campos, largura, altura, onCamposChange }: EtiquetaEditorProps) {
  const [warning, setWarning] = useState<string | null>(null);
  const [selectedCampoIndex, setSelectedCampoIndex] = useState<number | null>(null);
  const { setNodeRef } = useDroppable({
    id: 'etiqueta-area',
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const idParts = String(active.id).split('-');
    const tipo = idParts[1] as 'nome' | 'codigo' | 'preco';
    const index = Number(idParts[2]);
    
    if (isNaN(index) || index < 0 || index >= campos.length) return;

    const novosCampos = [...campos];
    const campo = novosCampos[index];
    
    // Calcular nova posição
    const novoX = campo.x + (delta?.x || 0) / 2; // Dividimos por 2 pois a visualização é ampliada 2x
    const novoY = campo.y + (delta?.y || 0) / 2; // Dividimos por 2 pois a visualização é ampliada 2x
    
    // Validar limites
    if (novoX < 0 || novoX + campo.largura > largura || 
        novoY < 0 || novoY + campo.altura > altura) {
      setWarning("O elemento não pode ultrapassar os limites da etiqueta");
      return;
    }
    
    // Atualizar posição
    novosCampos[index] = {
      ...campo,
      x: novoX,
      y: novoY,
    };
    
    setWarning(null);
    onCamposChange(novosCampos);
    setSelectedCampoIndex(index);
  };

  const handleCampoSelect = (index: number) => {
    setSelectedCampoIndex(index);
  };

  const handleUpdateCampo = (campoIndex: number, propriedade: string, valor: number) => {
    if (campoIndex === null || campoIndex < 0 || campoIndex >= campos.length) return;

    const novosCampos = [...campos];
    const campo = { ...novosCampos[campoIndex] };

    // Atualizar a propriedade
    switch (propriedade) {
      case 'x':
        if (valor < 0 || valor + campo.largura > largura) {
          setWarning("A posição X não pode fazer o elemento ultrapassar os limites da etiqueta");
          return;
        }
        campo.x = valor;
        break;
      case 'y':
        if (valor < 0 || valor + campo.altura > altura) {
          setWarning("A posição Y não pode fazer o elemento ultrapassar os limites da etiqueta");
          return;
        }
        campo.y = valor;
        break;
      case 'tamanhoFonte':
        if (valor < 5 || valor > 24) {
          setWarning("O tamanho da fonte deve estar entre 5pt e 24pt");
          return;
        }
        campo.tamanhoFonte = valor;
        break;
      case 'largura':
        if (valor <= 0 || campo.x + valor > largura) {
          setWarning("A largura deve ser positiva e não pode fazer o elemento ultrapassar os limites da etiqueta");
          return;
        }
        campo.largura = valor;
        break;
      case 'altura':
        if (valor <= 0 || campo.y + valor > altura) {
          setWarning("A altura deve ser positiva e não pode fazer o elemento ultrapassar os limites da etiqueta");
          return;
        }
        campo.altura = valor;
        break;
    }

    novosCampos[campoIndex] = campo;
    setWarning(null);
    onCamposChange(novosCampos);
  };

  const handleAddElemento = (tipo: 'nome' | 'codigo' | 'preco') => {
    // Verificar se o elemento já existe
    const existente = campos.find(c => c.tipo === tipo);
    if (existente) {
      setWarning("Este elemento já existe na etiqueta");
      return;
    }
    
    // Valores padrão para cada tipo de elemento
    let novoCampo: CampoEtiqueta;
    switch (tipo) {
      case 'nome':
        novoCampo = { tipo, x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7 };
        break;
      case 'codigo':
        novoCampo = { tipo, x: 2, y: 15, largura: 40, altura: 6, tamanhoFonte: 8 };
        break;
      case 'preco':
        novoCampo = { tipo, x: 45, y: 4, largura: 20, altura: 10, tamanhoFonte: 10 };
        break;
    }
    
    // Adicionar o novo campo
    const novosCampos = [...campos, novoCampo];
    setWarning(null);
    onCamposChange(novosCampos);
    setSelectedCampoIndex(novosCampos.length - 1);
  };

  return (
    <div className="space-y-4">
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4">
          <div className="w-48 space-y-4 p-4 bg-gray-50 rounded border">
            <div className="flex items-center gap-2 font-medium mb-2">
              <PanelLeftIcon className="h-4 w-4" />
              <h3>Elementos Disponíveis</h3>
            </div>
            <div className="space-y-2">
              {['nome', 'codigo', 'preco'].filter(tipo => 
                !campos.some(c => c.tipo === tipo)
              ).map(tipo => (
                <ElementoPaleta 
                  key={tipo} 
                  tipo={tipo as 'nome' | 'codigo' | 'preco'} 
                  onAdd={handleAddElemento} 
                />
              ))}
            </div>
            
            {campos.length > 0 && (
              <>
                <div className="border-t my-3"></div>
                <div className="font-medium mb-2">Elementos na Etiqueta</div>
                <div className="space-y-2">
                  {campos.map((campo, index) => (
                    <DraggableCampo 
                      key={`${campo.tipo}-${index}`} 
                      campo={campo} 
                      index={index}
                      onSelect={handleCampoSelect}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="bg-white border rounded p-4 mb-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <MoveIcon className="h-4 w-4" />
                Área de Edição
              </h3>
              <div className="text-xs text-gray-500 mb-2">
                Arraste os elementos para posicioná-los na etiqueta
              </div>
              <div 
                ref={setNodeRef}
                className="relative bg-white border rounded overflow-hidden"
                style={{
                  width: `${largura * 2}px`,
                  height: `${altura * 2}px`,
                  backgroundSize: '10px 10px',
                  backgroundImage: 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)'
                }}
              >
                {campos.map((campo, index) => (
                  <div
                    key={`preview-${campo.tipo}-${index}`}
                    className={`absolute border ${selectedCampoIndex === index ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-400'} p-1`}
                    style={{
                      left: campo.x * 2,
                      top: campo.y * 2,
                      width: campo.largura * 2,
                      height: campo.altura * 2,
                    }}
                    onClick={() => handleCampoSelect(index)}
                  >
                    <div className="text-xs truncate">
                      {campo.tipo === 'nome' ? 'Nome do Produto' :
                      campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedCampoIndex !== null && selectedCampoIndex >= 0 && selectedCampoIndex < campos.length && (
              <div className="bg-white border rounded p-4">
                <h3 className="font-medium mb-4">Propriedades do Elemento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posição X (mm)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border rounded"
                      value={campos[selectedCampoIndex].x}
                      onChange={(e) => handleUpdateCampo(selectedCampoIndex, 'x', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posição Y (mm)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border rounded"
                      value={campos[selectedCampoIndex].y}
                      onChange={(e) => handleUpdateCampo(selectedCampoIndex, 'y', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Largura (mm)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border rounded"
                      value={campos[selectedCampoIndex].largura}
                      onChange={(e) => handleUpdateCampo(selectedCampoIndex, 'largura', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Altura (mm)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border rounded"
                      value={campos[selectedCampoIndex].altura}
                      onChange={(e) => handleUpdateCampo(selectedCampoIndex, 'altura', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tamanho da Fonte (pt)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border rounded"
                      value={campos[selectedCampoIndex].tamanhoFonte}
                      onChange={(e) => handleUpdateCampo(selectedCampoIndex, 'tamanhoFonte', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}
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
