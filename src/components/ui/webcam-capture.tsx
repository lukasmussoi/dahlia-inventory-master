
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
  isActive: boolean; // Nova prop para controlar o estado da câmera
}

export function WebcamCapture({ onCapture, isActive }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // Referência para o stream

  // Iniciar a câmera ao montar o componente ou quando isActive mudar
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    
    // Cleanup function para garantir que a câmera seja desligada
    return () => {
      stopCamera();
    };
  }, [isActive]);

  // Função para iniciar a câmera
  const startCamera = async () => {
    try {
      // Primeiro, pare qualquer stream ativo para evitar múltiplas instâncias
      stopCamera();
      
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment" // Tenta usar a câmera traseira em dispositivos móveis
        } 
      });
      
      // Armazenar o stream na ref para uso posterior
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
      
      console.log("Câmera iniciada com sucesso");
    } catch (err) {
      console.error("Erro ao acessar a webcam:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      setIsCameraActive(false);
    }
  };

  // Função para parar a câmera
  const stopCamera = () => {
    // Verificar e parar o stream armazenado na ref
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log("Track parada:", track.kind, track.id, track.readyState);
      });
      streamRef.current = null;
    }
    
    // Limpar também o srcObject do vídeo como garantia adicional
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log("Track do vídeo parada:", track.kind, track.id, track.readyState);
      });
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
    console.log("Câmera desligada");
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
        
        // Converter canvas para blob (arquivo) com tipo MIME explícito
        canvas.toBlob((blob) => {
          if (blob) {
            // Criar um nome de arquivo único e seguro para URLs
            const timestamp = new Date().getTime();
            const randomStr = Math.random().toString(36).substring(2, 8);
            // Nomear arquivo com formato padronizado e extensão .jpg
            const fileName = `webcam_${timestamp}_${randomStr}.jpg`;
            
            // Criar um arquivo a partir do blob com tipo MIME explícito para JPEG
            const photoFile = new File(
              [blob], 
              fileName, 
              { 
                type: "image/jpeg", 
                lastModified: timestamp 
              }
            );
            
            // Log detalhado para depuração
            console.log("Foto capturada pela webcam:", {
              name: photoFile.name,
              type: photoFile.type,
              size: photoFile.size,
              lastModified: photoFile.lastModified,
              isFile: photoFile instanceof File
            });
            
            // Enviar o arquivo para o callback
            onCapture(photoFile);
          } else {
            console.error("Falha ao gerar blob da imagem capturada");
          }
        }, "image/jpeg", 0.9); // 90% de qualidade para JPEG
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
