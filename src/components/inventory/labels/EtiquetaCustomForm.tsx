
import { EtiquetaCreator } from './editor/EtiquetaCreator';
import type { ModeloEtiqueta } from "@/types/etiqueta";

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Componente principal para criar ou editar modelos de etiqueta
 * Usa exclusivamente o editor visual
 */
export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  return (
    <EtiquetaCreator 
      initialData={modelo}
      onClose={onClose}
      onSave={onSuccess}
    />
  );
}
