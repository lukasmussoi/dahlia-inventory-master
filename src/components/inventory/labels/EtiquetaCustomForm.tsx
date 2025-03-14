
import { EtiquetaCreator } from './editor/EtiquetaCreator';
import type { ModeloEtiqueta } from "@/types/etiqueta";

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  return (
    <EtiquetaCreator
      modelo={modelo}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
