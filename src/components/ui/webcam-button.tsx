
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
        className="h-9 px-3 gap-1.5 rounded-md" 
        onClick={() => setIsOpen(true)}
        title="Capturar foto com webcam"
        disabled={disabled}
      >
        <Camera size={18} className="text-gray-600" />
        <span>Webcam</span>
      </Button>

      <WebcamModal 
        isOpen={isOpen} 
        onOpenChange={handleOpenChange}
        onCapture={handleCapture}
      />
    </>
  );
}
