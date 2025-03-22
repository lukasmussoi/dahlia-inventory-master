
import { ModeloEtiqueta } from "@/types/etiqueta";
import EtiquetaCreator from "./EtiquetaCreator";
import { useState } from "react";

interface EtiquetaEditorProps {
  modelo?: ModeloEtiqueta;
  onSave: (modelo: ModeloEtiqueta) => void;
  onClose: () => void;
}

export function EtiquetaEditor({ modelo, onSave, onClose }: EtiquetaEditorProps) {
  const [autoAdjustDimensions, setAutoAdjustDimensions] = useState(false);

  const handleToggleAutoAdjust = () => {
    setAutoAdjustDimensions(prev => !prev);
  };

  const handleSave = (data: any) => {
    onSave(data);
  };

  return (
    <div className="w-full h-full">
      <EtiquetaCreator
        initialData={modelo}
        onClose={onClose}
        onSave={handleSave}
        autoAdjustDimensions={autoAdjustDimensions}
        onToggleAutoAdjust={handleToggleAutoAdjust}
      />
    </div>
  );
}
