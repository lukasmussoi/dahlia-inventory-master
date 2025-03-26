
/**
 * Modal para captura de fotos via webcam
 * 
 * Este componente implementa um modal que exibe o stream da webcam,
 * permite capturar fotos, visualizar as fotos capturadas e gerenciá-las
 * antes de finalizar.
 * 
 * Relaciona-se com:
 * - WebcamButton.tsx que é o componente que o aciona
 * - WebcamCapture.tsx para manipulação da câmera e captura
 */
import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WebcamCapture } from "./webcam-capture";
import { X, Trash2 } from "lucide-react";

interface WebcamModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (photos: File[]) => void;
}

export function WebcamModal({ isOpen, onOpenChange, onCapture }: WebcamModalProps) {
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<"capture" | "review">("capture");
  const [webcamActive, setWebcamActive] = useState(false);
  
  // Monitorar quando o modal é aberto/fechado para gerenciar o estado da webcam
  useEffect(() => {
    if (isOpen) {
      // Quando o modal abre, ativamos a webcam se a aba de captura estiver ativa
      if (activeTab === "capture") {
        setWebcamActive(true);
      }
    } else {
      // Quando o modal fecha, garantimos que a webcam esteja desligada
      setWebcamActive(false);
      
      // Resetar estado após um delay para permitir a animação de fechamento
      const timer = setTimeout(() => {
        if (!isOpen) {
          setActiveTab("capture");
          setCapturedPhotos([]);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  // Monitorar mudanças na aba ativa
  useEffect(() => {
    // Ativar webcam apenas se o modal estiver aberto e na aba de captura
    setWebcamActive(isOpen && activeTab === "capture");
  }, [activeTab, isOpen]);

  // Função para adicionar uma foto capturada à lista
  const handlePhotoCaptured = (photoFile: File) => {
    setCapturedPhotos((prev) => [...prev, photoFile]);
    // Muda para a aba de revisão automaticamente após capturar
    setActiveTab("review");
  };

  // Função para remover uma foto da lista
  const handleRemovePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Função para confirmar as fotos capturadas
  const handleConfirm = () => {
    if (capturedPhotos.length > 0) {
      onCapture(capturedPhotos);
    }
    
    // Desativar a webcam antes de fechar o modal
    setWebcamActive(false);
    setCapturedPhotos([]);
    setActiveTab("capture");
    onOpenChange(false);
  };

  // Função para cancelar e fechar o modal
  const handleCancel = () => {
    // Desativar a webcam, limpar fotos e fechar modal
    setWebcamActive(false);
    setCapturedPhotos([]);
    setActiveTab("capture");
    onOpenChange(false);
  };

  // Função de gerenciamento que fecha o modal com segurança
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Garantir que a webcam seja desligada antes de fechar
      setWebcamActive(false);
      // Fechar o modal
      onOpenChange(false);
    } else {
      onOpenChange(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Capturar Fotos via Webcam</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 border-b mb-4">
          <Button
            type="button"
            variant={activeTab === "capture" ? "default" : "ghost"}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            onClick={() => setActiveTab("capture")}
            data-state={activeTab === "capture" ? "active" : "inactive"}
          >
            Capturar
          </Button>
          <Button
            type="button"
            variant={activeTab === "review" ? "default" : "ghost"}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            onClick={() => setActiveTab("review")}
            data-state={activeTab === "review" ? "active" : "inactive"}
            disabled={capturedPhotos.length === 0}
          >
            Revisar ({capturedPhotos.length})
          </Button>
        </div>

        {activeTab === "capture" ? (
          <div className="flex flex-col items-center">
            <WebcamCapture 
              onCapture={handlePhotoCaptured} 
              isActive={webcamActive} 
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {capturedPhotos.map((photo, index) => (
                <div 
                  key={index} 
                  className="relative border rounded-md overflow-hidden group"
                >
                  <img 
                    src={URL.createObjectURL(photo)} 
                    alt={`Foto capturada ${index + 1}`} 
                    className="w-full h-40 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
            {capturedPhotos.length === 0 && (
              <p className="text-center text-muted-foreground">
                Nenhuma foto capturada ainda. Volte para a aba "Capturar".
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={capturedPhotos.length === 0}
          >
            Confirmar ({capturedPhotos.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
