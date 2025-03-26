
/**
 * Componente para captura de fotos via webcam
 * 
 * Este componente gerencia o acesso à webcam, exibe o stream de vídeo
 * e permite que o usuário capture fotos.
 * 
 * Relaciona-se com:
 * - WebcamModal.tsx que o utiliza para exibir o stream e capturar fotos
 */
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw } from "lucide-react";

interface WebcamCaptureProps {
  onCapture: (photoFile: File) => void;
  isActive: boolean; // Prop para controlar o estado da câmera
}

export function WebcamCapture({ onCapture, isActive }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // Referência para o stream

  // Iniciar ou parar a câmera quando isActive muda
  useEffect(() => {
    console.log("WebcamCapture - isActive mudou para:", isActive);
    
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    
    // Cleanup function para garantir que a câmera seja desligada
    return () => {
      console.log("WebcamCapture - componente desmontado. Parando câmera...");
      stopCamera();
    };
  }, [isActive]);

  // Função para iniciar a câmera
  const startCamera = async () => {
    try {
      // Primeiro, pare qualquer stream ativo para evitar múltiplas instâncias
      stopCamera();
      
      setError(null);
      console.log("Iniciando câmera...");
      
      // Solicitar permissão para acessar a câmera
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
        videoRef.current.play().catch(err => {
          console.error("Erro ao reproduzir vídeo:", err);
        });
        
        setIsCameraActive(true);
        console.log("Câmera iniciada com sucesso. Tracks:", stream.getTracks().length);
        
        // Verificar as trilhas de mídia disponíveis
        stream.getTracks().forEach(track => {
          console.log(`Trilha: ${track.kind}, ID: ${track.id}, Estado: ${track.readyState}`);
        });
      }
    } catch (err) {
      console.error("Erro ao acessar a webcam:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      setIsCameraActive(false);
    }
  };

  // Função para parar a câmera com segurança
  const stopCamera = () => {
    console.log("Parando câmera...");
    
    // Verificar e parar o stream armazenado na ref
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      
      tracks.forEach(track => {
        track.stop();
        console.log(`Track parada: ${track.kind}, ID: ${track.id}, Estado após parar: ${track.readyState}`);
      });
      
      streamRef.current = null;
    }
    
    // Limpar também o srcObject do vídeo como garantia adicional
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => {
        track.stop();
        console.log(`Track do vídeo parada: ${track.kind}, ID: ${track.id}, Estado após parar: ${track.readyState}`);
      });
      
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
    console.log("Câmera desligada com sucesso");
  };

  // Função para reiniciar a câmera
  const restartCamera = () => {
    console.log("Reiniciando câmera...");
    stopCamera();
    setTimeout(() => {
      if (isActive) {
        startCamera();
      }
    }, 300);
  };

  // Função para capturar uma foto
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && isCameraActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Verificar se o vídeo está pronto para captura
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        console.warn("Vídeo não está pronto para captura. Estado:", video.readyState);
        return;
      }
      
      console.log("Capturando foto da webcam...");
      console.log(`Dimensões do vídeo: ${video.videoWidth}x${video.videoHeight}`);
      
      // Configurar canvas para corresponder ao tamanho do vídeo
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
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
    } else {
      console.error("Não foi possível capturar foto: vídeo ou canvas não disponível ou câmera inativa");
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
            onClick={() => {
              if (isActive) {
                startCamera();
              }
            }}
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
            
            {!isCameraActive && isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                <p>Iniciando câmera...</p>
              </div>
            )}
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
