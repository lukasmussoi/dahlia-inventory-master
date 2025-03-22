
import { Button } from "@/components/ui/button";
import { Plus, Copy } from "lucide-react";
import type { ModeloEtiqueta } from "@/types/etiqueta";

interface ModeloManagerProps {
  selectedModelo: ModeloEtiqueta | null;
  onDuplicar: () => void;
  onNovo: () => void;
}

export function ModeloManager({ selectedModelo, onDuplicar, onNovo }: ModeloManagerProps) {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-sm font-medium">Gerenciar Modelos</h3>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDuplicar} 
          disabled={!selectedModelo}
          className="flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Duplicar
        </Button>
        <Button variant="outline" size="sm" onClick={onNovo} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Modelo
        </Button>
      </div>
    </div>
  );
}
