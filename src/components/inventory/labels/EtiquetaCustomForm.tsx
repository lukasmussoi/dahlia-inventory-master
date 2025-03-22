
import { Button } from "@/components/ui/button";
import EtiquetaCreator from './editor/EtiquetaCreator';
import type { ModeloEtiqueta } from "@/types/etiqueta";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useEtiquetaCustomForm } from "@/hooks/useEtiquetaCustomForm";

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  const { isLoading, onSubmit } = useEtiquetaCustomForm(modelo, onClose, onSuccess);
  
  const handleSave = (data: any) => {
    // Submeter o formulário com os dados do editor visual
    onSubmit(data);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">Editor de Etiquetas</h2>
        </div>
      </div>
      <EtiquetaCreator 
        onClose={onClose}
        onSave={handleSave}
        initialData={modelo}
        isLoading={isLoading}
      />
    </div>
  );
}
