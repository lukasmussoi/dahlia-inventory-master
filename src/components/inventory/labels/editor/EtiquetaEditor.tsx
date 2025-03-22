
import { ModeloEtiqueta } from "@/types/etiqueta";
import EtiquetaCreator from "./EtiquetaCreator";
import { useState } from "react";
import { EtiquetaEditorProps } from "./types";

export function EtiquetaEditor({ 
  modelo, 
  onSave, 
  onClose,
  campos,
  largura,
  altura,
  formatoPagina,
  orientacao,
  margemSuperior,
  margemInferior,
  margemEsquerda,
  margemDireita,
  espacamentoHorizontal,
  espacamentoVertical,
  larguraPagina,
  alturaPagina,
  showPageView,
  onCamposChange,
  onDimensoesChange,
  onMargensChange,
  onEspacamentoChange,
  onFormatoChange
}: EtiquetaEditorProps) {
  const [autoAdjustDimensions, setAutoAdjustDimensions] = useState(false);

  // Se estamos no modo legado, usando as propriedades antigas
  if (campos) {
    // Este é o código legado para o Editor antigo
    // Aqui implementaríamos a lógica do editor antigo
    // Como estamos em processo de migração, este código seria apenas para compatibilidade
    
    return (
      <div className="w-full h-full">
        <div className="text-center py-6">Editor legado em processo de migração.</div>
      </div>
    );
  }

  // Novo editor usando EtiquetaCreator
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
