
/**
 * Componente para captura de fotos via webcam
 * 
 * Este componente gerencia o acesso à webcam, exibe o stream de vídeo
 * e permite que o usuário capture fotos.
 * 
 * Relaciona-se com:
 * - WebcamModal.tsx que o utiliza para exibir o stream e capturar fotos
 */
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw } from "lucide-react";

interface WebcamCaptureProps {
  onCapture: (photoFile: File) => void;
}

export function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Iniciar a câmera ao montar o componente
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Função para iniciar a câmera
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment" // Tenta usar a câmera traseira em dispositivos móveis
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Erro ao acessar a webcam:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      setIsCameraActive(false);
    }
  };

  // Função para parar a câmera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // Função para reiniciar a câmera
  const restartCamera = () => {
    stopCamera();
    setTimeout(startCamera, 300);
  };

  // Função para capturar uma foto
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Configurar canvas para corresponder ao tamanho do vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Desenhar frame atual do vídeo no canvas
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Converter canvas para blob (arquivo)
        canvas.toBlob((blob) => {
          if (blob) {
            // Criar um arquivo a partir do blob
            const photoFile = new File(
              [blob], 
              `photo_${new Date().getTime()}.jpg`, 
              { type: "image/jpeg" }
            );
            
            // Enviar o arquivo para o callback
            onCapture(photoFile);
          }
        }, "image/jpeg", 0.9); // 90% de qualidade
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
          <p>{error}</p>
          <Button 
            type="button" 
            variant="outline" 
            className="mt-2" 
            onClick={startCamera}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              muted 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={restartCamera}
              disabled={!isCameraActive}
              className="text-sm"
            >
              <RefreshCw size={16} className="mr-1" />
              Reiniciar câmera
            </Button>
            
            <Button
              type="button"
              onClick={capturePhoto}
              disabled={!isCameraActive}
              className="text-sm"
            >
              <Camera size={16} className="mr-1" />
              Capturar foto
            </Button>
          </div>
          
          {/* Canvas oculto para processamento das capturas */}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </>
      )}
    </div>
  );
}
