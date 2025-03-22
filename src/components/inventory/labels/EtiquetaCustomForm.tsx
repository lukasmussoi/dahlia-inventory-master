
import { Button } from "@/components/ui/button";
import EtiquetaCreator from './editor/EtiquetaCreator';
import type { ModeloEtiqueta } from "@/types/etiqueta";

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Componente principal para criar ou editar modelos de etiqueta
 */
export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  // Usar somente o editor visual, removendo completamente o editor tradicional
  return (
    <EtiquetaCreator 
      onClose={onClose}
      onSave={onSuccess}
      initialData={modelo}
    />
  );
}
