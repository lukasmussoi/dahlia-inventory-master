
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { WebcamButton } from "@/components/ui/webcam-button";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Upload, Save } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { FormValues } from "@/hooks/useInventoryForm";
import { supabase } from "@/integrations/supabase/client";

interface PhotoFieldsProps {
  form: UseFormReturn<any>;
  photos: File[];
  setPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  primaryPhotoIndex: number | null;
  setPrimaryPhotoIndex: React.Dispatch<React.SetStateAction<number | null>>;
  uploadProgress: number;
  setUploadProgress: React.Dispatch<React.SetStateAction<number>>;
  onSavePhotos: () => void;
}

export function PhotoFields({
  form,
  photos,
  setPhotos,
  primaryPhotoIndex,
  setPrimaryPhotoIndex,
  uploadProgress,
  setUploadProgress,
  onSavePhotos
}: PhotoFieldsProps) {
  // Configurar o dropzone para upload de arquivos
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    onDrop: (acceptedFiles) => {
      setPhotos((prev) => [...prev, ...acceptedFiles]);
      
      // Se não houver foto primária definida, define a primeira
      if (primaryPhotoIndex === null && acceptedFiles.length > 0) {
        setPrimaryPhotoIndex(photos.length);
      }
    }
  });

  // Função para marcar uma foto como principal
  const handleSetPrimary = (index: number) => {
    setPrimaryPhotoIndex(index);
  };

  // Função para remover uma foto da lista
  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    
    // Ajustar o índice da foto primária se necessário
    if (primaryPhotoIndex === index) {
      setPrimaryPhotoIndex(photos.length > 1 ? 0 : null);
    } else if (primaryPhotoIndex !== null && primaryPhotoIndex > index) {
      setPrimaryPhotoIndex(primaryPhotoIndex - 1);
    }
  };

  // Função para adicionar fotos da webcam
  const handleWebcamCapture = (capturedPhotos: File[]) => {
    console.log("Fotos capturadas pela webcam:", capturedPhotos);
    setPhotos((prev) => [...prev, ...capturedPhotos]);
    
    // Se não houver foto primária definida, define a primeira nova foto
    if (primaryPhotoIndex === null && capturedPhotos.length > 0) {
      setPrimaryPhotoIndex(photos.length);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-base font-medium">Fotos do Item</div>
        <div className="flex gap-2">
          <WebcamButton onCaptureComplete={handleWebcamCapture} />
          
          <Button
            type="button"
            variant="outline" 
            size="sm" 
            className="h-8 px-2" 
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <Upload size={16} className="mr-1" />
            <span className="text-xs">Upload</span>
          </Button>
          
          <Button
            type="button"
            variant="default" 
            size="sm" 
            className="h-8 px-2 bg-green-600 hover:bg-green-700"
            onClick={onSavePhotos}
            disabled={photos.length === 0}
          >
            <Save size={16} className="mr-1" />
            <span className="text-xs">Salvar Fotos</span>
          </Button>
        </div>
      </div>

      {/* Área de soltar arquivos */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
      >
        <input {...getInputProps()} />
        <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {isDragActive
            ? 'Solte as imagens aqui...'
            : 'Arraste e solte imagens aqui, ou clique para selecionar'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Formatos aceitos: JPEG, PNG, GIF, WEBP
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {photos.map((photo, index) => (
            <div 
              key={index} 
              className={`relative group border rounded-md overflow-hidden ${
                primaryPhotoIndex === index ? 'ring-2 ring-primary' : ''
              }`}
            >
              <img 
                src={URL.createObjectURL(photo)} 
                alt={`Foto ${index + 1}`} 
                className="w-full h-32 object-cover"
              />
              
              {/* Badge indicando foto principal */}
              {primaryPhotoIndex === index && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  Principal
                </div>
              )}
              
              {/* Botões de ação */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {primaryPhotoIndex !== index && (
                  <Button 
                    type="button"
                    size="sm" 
                    variant="secondary" 
                    onClick={() => handleSetPrimary(index)}
                  >
                    Definir como principal
                  </Button>
                )}
                <Button 
                  type="button"
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleRemovePhoto(index)}
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
