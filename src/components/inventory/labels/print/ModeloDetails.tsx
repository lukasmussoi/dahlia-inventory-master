
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { ModeloEtiqueta } from "@/types/etiqueta";

interface ModeloDetailsProps {
  selectedModelo: ModeloEtiqueta | null;
  modeloWarning: string | null;
}

export function ModeloDetails({ selectedModelo, modeloWarning }: ModeloDetailsProps) {
  if (!selectedModelo) return null;

  return (
    <div className="space-y-4">
      <div className="border p-4 rounded-md bg-slate-50">
        <h4 className="font-medium mb-2">Detalhes do modelo: {selectedModelo.nome}</h4>
        <div className="text-sm space-y-1">
          <p>Dimensões da etiqueta: {selectedModelo.largura}mm × {selectedModelo.altura}mm</p>
          <p>Formato da página: {selectedModelo.formatoPagina} 
            {selectedModelo.formatoPagina === "Personalizado" && selectedModelo.larguraPagina && selectedModelo.alturaPagina ? 
              ` (${selectedModelo.larguraPagina}mm × ${selectedModelo.alturaPagina}mm)` : ""}
          </p>
          <p>Orientação: {selectedModelo.orientacao === "retrato" ? "Retrato" : "Paisagem"}</p>
        </div>
      </div>
      
      {modeloWarning && <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-700" />
        <AlertTitle className="text-yellow-800">Atenção</AlertTitle>
        <AlertDescription className="text-yellow-700">
          {modeloWarning}
        </AlertDescription>
      </Alert>}
    </div>
  );
}
