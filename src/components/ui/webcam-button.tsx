
/**
 * Componente de botão para captura de fotos via webcam
 * 
 * Este componente renderiza um botão discreto que, quando clicado,
 * abre um modal para captura de fotos utilizando a webcam do usuário.
 * 
 * Relaciona-se com:
 * - WebcamModal.tsx para exibição da interface de captura
 */
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useState } from "react";
import { WebcamModal } from "./webcam-modal";

interface WebcamButtonProps {
  onCaptureComplete: (capturedPhotos: File[]) => void;
  disabled?: boolean; // Adicionando propriedade opcional de desativação
}

export function WebcamButton({ onCaptureComplete, disabled = false }: WebcamButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const handleCapture = (photos: File[]) => {
    onCaptureComplete(photos);
    setIsOpen(false);
  };

  return (
    <>
      <Button 
        type="button"
        variant="outline" 
        size="sm" 
        className="h-8 px-2" 
        onClick={() => setIsOpen(true)}
        title="Capturar foto com webcam"
        disabled={disabled} // Usando a propriedade disabled no botão
      >
        <Camera size={16} className="mr-1" />
        <span className="text-xs">Webcam</span>
      </Button>

      <WebcamModal 
        isOpen={isOpen} 
        onOpenChange={handleOpenChange}
        onCapture={handleCapture}
      />
    </>
  );
}
