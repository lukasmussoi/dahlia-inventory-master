
import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { WebcamButton } from "@/components/ui/webcam-button";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { FormValues, PhotoItem } from "@/hooks/useInventoryForm";

interface PhotoFieldsProps {
  form?: UseFormReturn<any>; // Tornar form opcional
  photos: PhotoItem[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoItem[]>>;
  addPhotos?: (files: File[]) => void;
  addPhoto?: (file: File) => void;
  setPrimaryPhoto: (index: number) => void;
  removePhoto: (index: number) => void;
  uploadProgress: number;
  setUploadProgress: React.Dispatch<React.SetStateAction<number>>;
  onSavePhotos: () => void;
  itemId?: string; // Adicionar itemId opcional para permitir salvamento direto
  disabled?: boolean; // Adicionar disabled para controlar quando os botões devem estar desativados
  photosModified?: boolean; // Adicionar controle de modificação
  setPhotosModified?: React.Dispatch<React.SetStateAction<boolean>>; // Adicionar controle de modificação
}

export function PhotoFields({
  form,
  photos,
  setPhotos,
  addPhotos,
  addPhoto,
  setPrimaryPhoto,
  removePhoto,
  uploadProgress,
  setUploadProgress,
  onSavePhotos,
  itemId,
  disabled = false,
  photosModified = false,
  setPhotosModified
}: PhotoFieldsProps) {
  // Adicionar estado para controlar submissão
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Configurar o dropzone para upload de arquivos
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    onDrop: (acceptedFiles) => {
      console.log("Arquivos aceitos no drop:", acceptedFiles.length);
      
      if (addPhotos) {
        addPhotos(acceptedFiles);
      } else if (addPhoto) {
        // Adicionar um por um se não tivermos addPhotos
        acceptedFiles.forEach(file => addPhoto(file));
      } else {
        // Fallback para o método antigo se necessário
        const newPhotos = acceptedFiles.map(file => ({
          file,
          is_primary: false,
          type: 'new' as const
        }));
        
        // Atualizar o estado com novas fotos
        setPhotos(prevPhotos => {
          const updatedPhotos = [...prevPhotos, ...newPhotos];
          
          // Se não houver foto primária definida, definir a primeira como primária
          if (!updatedPhotos.some(p => p.is_primary) && updatedPhotos.length > 0) {
            updatedPhotos[0].is_primary = true;
          }
          
          return updatedPhotos;
        });
        
        // Marcar que houve modificação nas fotos
        if (setPhotosModified) {
          setPhotosModified(true);
        }
      }
    }
  });

  // Função para adicionar fotos da webcam
  const handleWebcamCapture = (capturedPhotos: File[]) => {
    console.log("Fotos capturadas pela webcam:", capturedPhotos.length);
    
    if (addPhotos) {
      addPhotos(capturedPhotos);
    } else if (addPhoto) {
      // Adicionar um por um se não tivermos addPhotos
      capturedPhotos.forEach(file => addPhoto(file));
    } else {
      // Fallback para o método antigo se necessário
      const newPhotos = capturedPhotos.map(file => ({
        file,
        is_primary: false,
        type: 'new' as const
      }));
      
      // Atualizar o estado
      setPhotos(prevPhotos => {
        const updatedPhotos = [...prevPhotos, ...newPhotos];
        
        // Se não houver foto primária definida, definir a primeira como primária
        if (!updatedPhotos.some(p => p.is_primary) && updatedPhotos.length > 0) {
          updatedPhotos[0].is_primary = true;
        }
        
        return updatedPhotos;
      });
      
      // Marcar que houve modificação nas fotos
      if (setPhotosModified) {
        setPhotosModified(true);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <WebcamButton onCaptureComplete={handleWebcamCapture} disabled={disabled} />
        
        <Button
          type="button"
          variant="outline" 
          size="sm" 
          className="h-9 px-3 gap-1.5 rounded-md" 
          {...getRootProps()}
          disabled={disabled}
        >
          <input {...getInputProps()} disabled={disabled} />
          <Upload size={18} className="text-gray-600" />
          <span>Upload</span>
        </Button>
      </div>

      {/* Área de soltar arquivos */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-zinc-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={disabled} />
        <Camera className="h-12 w-12 text-zinc-300 mb-2" />
        <p className="text-sm text-zinc-500">
          {isDragActive
            ? 'Solte as imagens aqui...'
            : 'Arraste e solte as fotos aqui, ou clique para selecionar'}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Formatos aceitos: JPEG, PNG, GIF, WEBP
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          (Máximo 5 fotos)
        </p>
      </div>

      {/* Barra de progresso para upload */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <Progress value={uploadProgress} max={100} />
          <p className="text-xs text-center text-muted-foreground">
            Enviando fotos... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Grid para exibição das fotos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
          {photos.map((photo, index) => (
            <div 
              key={index} 
              className={`relative group border rounded-md overflow-hidden ${
                photo.is_primary ? 'ring-2 ring-primary' : ''
              }`}
            >
              <img 
                src={
                  // Usar photo_url se disponível, ou criar URL para o arquivo
                  photo.photo_url || (photo.file ? URL.createObjectURL(photo.file) : '')
                }
                alt={`Foto ${index + 1}`} 
                className="w-full h-32 object-cover"
              />
              
              {/* Badge indicando foto principal */}
              {photo.is_primary && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  Principal
                </div>
              )}
              
              {/* Indicador de foto já existente */}
              {photo.type === 'existing' && (
                <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Existente
                </div>
              )}
              
              {/* Botões de ação */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!photo.is_primary && (
                  <Button 
                    type="button"
                    size="sm" 
                    variant="secondary" 
                    onClick={() => setPrimaryPhoto(index)}
                    disabled={disabled}
                  >
                    Definir como principal
                  </Button>
                )}
                <Button 
                  type="button"
                  size="sm" 
                  variant="destructive" 
                  onClick={() => removePhoto(index)}
                  disabled={disabled}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
