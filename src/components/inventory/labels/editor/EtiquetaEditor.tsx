
import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  AlertCircle, 
  MoveIcon,
  PanelLeftIcon,
  GripVertical,
  Ruler
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { CampoEtiqueta } from "@/types/etiqueta";

interface EtiquetaEditorProps {
  campos: CampoEtiqueta[];
  largura: number;
  altura: number;
  onCamposChange: (campos: CampoEtiqueta[]) => void;
  onDimensoesChange?: (largura: number, altura: number) => void;
}

function DraggableCampo({ campo, index, onSelect, isSelected }: { 
  campo: CampoEtiqueta; 
  index: number;
  onSelect: (index: number) => void;
  isSelected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `campo-${campo.tipo}-${index}`,
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
  } : undefined;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(index);
  };

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`cursor-move absolute border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-400'} p-1`}
      style={{
        ...style,
        left: campo.x * 2,
        top: campo.y * 2,
        width: campo.largura * 2,
        height: campo.altura * 2,
      }}
      onClick={handleClick}
    >
      <div className="text-xs truncate">
        {campo.tipo === 'nome' ? 'Nome do Produto' :
        campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
      </div>
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

export function EtiquetaEditor({ campos, largura, altura, onCamposChange, onDimensoesChange }: EtiquetaEditorProps) {
  const [warning, setWarning] = useState<string | null>(null);
  const [selectedCampoIndex, setSelectedCampoIndex] = useState<number | null>(null);
  const [localLargura, setLocalLargura] = useState(largura);
  const [localAltura, setLocalAltura] = useState(altura);
  const [isDragging, setIsDragging] = useState(false);
  
  const { setNodeRef } = useDroppable({
    id: 'etiqueta-area',
  });

  // Sincronizar dimensões locais com props
  useEffect(() => {
    setLocalLargura(largura);
    setLocalAltura(altura);
  }, [largura, altura]);

  // Atualizar as dimensões quando mudam localmente
  const handleDimensoesChange = () => {
    if (onDimensoesChange) {
      onDimensoesChange(localLargura, localAltura);
    }
    
    // Verificar se os elementos estão dentro dos limites da nova dimensão
    const camposAjustados = campos.map(campo => {
      let ajustado = { ...campo };
      
      // Se a posição X + largura ultrapassa a largura da etiqueta
      if (campo.x + campo.largura > localLargura) {
        // Se apenas a posição X está dentro da etiqueta, ajustar a largura
        if (campo.x < localLargura) {
          ajustado.largura = localLargura - campo.x;
        } 
        // Se a posição X já está fora, mover para dentro
        else {
          ajustado.x = Math.max(0, localLargura - campo.largura);
        }
      }
      
      // Se a posição Y + altura ultrapassa a altura da etiqueta
      if (campo.y + campo.altura > localAltura) {
        // Se apenas a posição Y está dentro da etiqueta, ajustar a altura
        if (campo.y < localAltura) {
          ajustado.altura = localAltura - campo.y;
        } 
        // Se a posição Y já está fora, mover para dentro
        else {
          ajustado.y = Math.max(0, localAltura - campo.altura);
        }
      }
      
      return ajustado;
    });
    
    onCamposChange(camposAjustados);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    const { active } = event;
    const idParts = String(active.id).split('-');
    const index = Number(idParts[2]);
    
    if (!isNaN(index) && index >= 0 && index < campos.length) {
      setSelectedCampoIndex(index);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, delta } = event;
    const idParts = String(active.id).split('-');
    const tipo = idParts[1] as 'nome' | 'codigo' | 'preco';
    const index = Number(idParts[2]);
    
    if (isNaN(index) || index < 0 || index >= campos.length) return;

    const novosCampos = [...campos];
    const campo = novosCampos[index];
    
    // Calcular nova posição
    const novoX = campo.x + (delta?.x || 0) / 2; // Dividimos por 2, visualização ampliada
    const novoY = campo.y + (delta?.y || 0) / 2; // Dividimos por 2, visualização ampliada
    
    // Validar limites
    if (novoX < 0 || novoX + campo.largura > localLargura || 
        novoY < 0 || novoY + campo.altura > localAltura) {
      
      // Calcular posição ajustada dentro dos limites
      const xAjustado = Math.max(0, Math.min(novoX, localLargura - campo.largura));
      const yAjustado = Math.max(0, Math.min(novoY, localAltura - campo.altura));
      
      novosCampos[index] = {
        ...campo,
        x: xAjustado,
        y: yAjustado,
      };
      
      setWarning("O elemento foi ajustado para ficar dentro dos limites da etiqueta");
      setTimeout(() => setWarning(null), 3000);
    } else {
      // Atualizar posição normalmente
      novosCampos[index] = {
        ...campo,
        x: novoX,
        y: novoY,
      };
      setWarning(null);
    }
    
    onCamposChange(novosCampos);
  };

  const handleCampoSelect = (index: number) => {
    setSelectedCampoIndex(index);
  };

  const handleEditorAreaClick = () => {
    setSelectedCampoIndex(null);
  };

  const handleUpdateCampo = (campoIndex: number, propriedade: string, valor: number) => {
    if (campoIndex === null || campoIndex < 0 || campoIndex >= campos.length) return;

    const novosCampos = [...campos];
    const campo = { ...novosCampos[campoIndex] };

    // Atualizar a propriedade
    switch (propriedade) {
      case 'x':
        if (valor < 0 || valor + campo.largura > localLargura) {
          const valorAjustado = Math.max(0, Math.min(valor, localLargura - campo.largura));
          setWarning(`A posição X foi ajustada para ${valorAjustado}mm para manter o elemento dentro da etiqueta`);
          campo.x = valorAjustado;
        } else {
          campo.x = valor;
          setWarning(null);
        }
        break;
      case 'y':
        if (valor < 0 || valor + campo.altura > localAltura) {
          const valorAjustado = Math.max(0, Math.min(valor, localAltura - campo.altura));
          setWarning(`A posição Y foi ajustada para ${valorAjustado}mm para manter o elemento dentro da etiqueta`);
          campo.y = valorAjustado;
        } else {
          campo.y = valor;
          setWarning(null);
        }
        break;
      case 'tamanhoFonte':
        if (valor < 5 || valor > 24) {
          const valorAjustado = Math.max(5, Math.min(valor, 24));
          setWarning(`O tamanho da fonte foi ajustado para ${valorAjustado}pt (entre 5pt e 24pt)`);
          campo.tamanhoFonte = valorAjustado;
        } else {
          campo.tamanhoFonte = valor;
          setWarning(null);
        }
        break;
      case 'largura':
        if (valor <= 0 || campo.x + valor > localLargura) {
          const valorAjustado = Math.max(1, Math.min(valor, localLargura - campo.x));
          setWarning(`A largura foi ajustada para ${valorAjustado}mm para manter o elemento dentro da etiqueta`);
          campo.largura = valorAjustado;
        } else {
          campo.largura = valor;
          setWarning(null);
        }
        break;
      case 'altura':
        if (valor <= 0 || campo.y + valor > localAltura) {
          const valorAjustado = Math.max(1, Math.min(valor, localAltura - campo.y));
          setWarning(`A altura foi ajustada para ${valorAjustado}mm para manter o elemento dentro da etiqueta`);
          campo.altura = valorAjustado;
        } else {
          campo.altura = valor;
          setWarning(null);
        }
        break;
    }

    novosCampos[campoIndex] = campo;
    onCamposChange(novosCampos);
  };

  const handleAddElemento = (tipo: 'nome' | 'codigo' | 'preco') => {
    // Verificar se o elemento já existe
    const existente = campos.find(c => c.tipo === tipo);
    if (existente) {
      setWarning("Este elemento já existe na etiqueta");
      setTimeout(() => setWarning(null), 3000);
      return;
    }
    
    // Valores padrão para cada tipo de elemento
    let novoCampo: CampoEtiqueta;
    switch (tipo) {
      case 'nome':
        novoCampo = { tipo, x: 2, y: 4, largura: Math.min(40, localLargura - 4), altura: Math.min(10, localAltura - 8), tamanhoFonte: 7 };
        break;
      case 'codigo':
        novoCampo = { tipo, x: 2, y: 15, largura: Math.min(40, localLargura - 4), altura: Math.min(6, localAltura - 18), tamanhoFonte: 8 };
        break;
      case 'preco':
        novoCampo = { tipo, x: Math.max(2, localLargura - 22), y: 4, largura: Math.min(20, localLargura / 4), altura: Math.min(10, localAltura - 8), tamanhoFonte: 10 };
        break;
    }
    
    // Adicionar o novo campo
    const novosCampos = [...campos, novoCampo];
    setWarning(null);
    onCamposChange(novosCampos);
    setSelectedCampoIndex(novosCampos.length - 1);
  };

  const removerElementoSelecionado = () => {
    if (selectedCampoIndex !== null && selectedCampoIndex >= 0 && selectedCampoIndex < campos.length) {
      const novosCampos = [...campos];
      novosCampos.splice(selectedCampoIndex, 1);
      onCamposChange(novosCampos);
      setSelectedCampoIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Dimensões da Etiqueta
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="largura-etiqueta" className="text-sm whitespace-nowrap">Largura (mm):</Label>
              <Input
                id="largura-etiqueta"
                type="number"
                className="w-20 h-8"
                value={localLargura}
                onChange={(e) => setLocalLargura(Number(e.target.value))}
                onBlur={handleDimensoesChange}
                min={10}
                max={210}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="altura-etiqueta" className="text-sm whitespace-nowrap">Altura (mm):</Label>
              <Input
                id="altura-etiqueta"
                type="number"
                className="w-20 h-8"
                value={localAltura}
                onChange={(e) => setLocalAltura(Number(e.target.value))}
                onBlur={handleDimensoesChange}
                min={5}
                max={297}
              />
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mb-2">
          Arraste os elementos para posicioná-los na etiqueta
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
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
                    <div 
                      key={`list-${campo.tipo}-${index}`}
                      className={`p-2 rounded cursor-pointer ${selectedCampoIndex === index ? 'bg-blue-50 border border-blue-200' : 'bg-white border'}`}
                      onClick={() => handleCampoSelect(index)}
                    >
                      <div className="text-sm flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        {campo.tipo === 'nome' ? 'Nome do Produto' :
                         campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
                      </div>
                    </div>
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
              <div 
                ref={setNodeRef}
                className={`relative bg-white border rounded overflow-hidden ${isDragging ? 'border-blue-400' : 'border-gray-300'}`}
                style={{
                  width: `${localLargura * 2}px`,
                  height: `${localAltura * 2}px`,
                  backgroundSize: '10px 10px',
                  backgroundImage: 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)'
                }}
                onClick={handleEditorAreaClick}
              >
                {campos.map((campo, index) => (
                  <DraggableCampo
                    key={`${campo.tipo}-${index}`}
                    campo={campo}
                    index={index}
                    onSelect={handleCampoSelect}
                    isSelected={selectedCampoIndex === index}
                  />
                ))}
              </div>
            </div>
            
            {selectedCampoIndex !== null && selectedCampoIndex >= 0 && selectedCampoIndex < campos.length && (
              <div className="bg-white border rounded p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium mb-4">Propriedades do Elemento</h3>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={removerElementoSelecionado}
                    className="h-7 px-2"
                  >
                    Remover
                  </Button>
                </div>
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
                      min={0}
                      max={localLargura - campos[selectedCampoIndex].largura}
                      step={1}
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
                      min={0}
                      max={localAltura - campos[selectedCampoIndex].altura}
                      step={1}
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
                      min={1}
                      max={localLargura - campos[selectedCampoIndex].x}
                      step={1}
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
                      min={1}
                      max={localAltura - campos[selectedCampoIndex].y}
                      step={1}
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
                      min={5}
                      max={24}
                      step={0.5}
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

      <div className="p-3 bg-gray-50 border rounded mt-4">
        <h4 className="text-sm font-medium mb-2">Dicas de uso:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Arraste os elementos da paleta para adicionar à etiqueta</li>
          <li>• Clique em um elemento para editar suas propriedades</li>
          <li>• Ajuste as dimensões da etiqueta para corresponder ao seu papel de impressão</li>
          <li>• Todos os elementos devem estar dentro dos limites da etiqueta</li>
        </ul>
      </div>
    </div>
  );
}

// Importação implícita do componente Button
import { Button } from "@/components/ui/button";
