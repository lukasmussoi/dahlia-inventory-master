
import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { WebcamButton } from "@/components/ui/webcam-button";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { FormValues } from "@/hooks/useInventoryForm";
import { supabase } from "@/integrations/supabase/client";
import { uploadMultiplePhotos } from "@/utils/photoUploadUtils";

interface PhotoFieldsProps {
  form?: UseFormReturn<any>; // Tornar form opcional
  photos: File[];
  setPhotos: React.Dispatch<React.SetStateAction<File[]>>;
  primaryPhotoIndex: number | null;
  setPrimaryPhotoIndex: React.Dispatch<React.SetStateAction<number | null>>;
  uploadProgress: number;
  setUploadProgress: React.Dispatch<React.SetStateAction<number>>;
  onSavePhotos: () => void;
  itemId?: string; // Adicionar itemId opcional para permitir salvamento direto
  disabled?: boolean; // Adicionar disabled para controlar quando os botões devem estar desativados
  photoUrls?: string[]; // Adicionar URLs das fotos existentes
  setPhotoUrls?: React.Dispatch<React.SetStateAction<string[]>>; // Para atualizar URLs
  setPhotosModified?: React.Dispatch<React.SetStateAction<boolean>>; // Adicionar controle de modificação
  originalPhotoUrls?: string[]; // Para comparação com fotos originais
}

export function PhotoFields({
  form,
  photos,
  setPhotos,
  primaryPhotoIndex,
  setPrimaryPhotoIndex,
  uploadProgress,
  setUploadProgress,
  onSavePhotos,
  itemId,
  disabled = false,
  photoUrls = [],
  setPhotoUrls,
  setPhotosModified,
  originalPhotoUrls = []
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
      
      // Importante: precisamos gerar um novo array de fotos, não apenas adicionar
      const newPhotos = [...photos, ...acceptedFiles];
      setPhotos(newPhotos);
      
      // Também ajustar as URLs - adicionamos undefined para cada nova foto
      if (setPhotoUrls) {
        // Garantir que os tamanhos estejam consistentes
        const currentUrls = [...photoUrls];
        const newUrls = [...currentUrls, ...Array(acceptedFiles.length).fill(undefined)];
        setPhotoUrls(newUrls);
        console.log("URLs atualizadas após drop:", newUrls.length);
      }
      
      // Se não houver foto primária definida, define a primeira
      if (primaryPhotoIndex === null && acceptedFiles.length > 0) {
        setPrimaryPhotoIndex(photos.length);
      }
      
      // Marcar que houve modificação nas fotos
      if (setPhotosModified) {
        setPhotosModified(true);
        console.log("Fotos marcadas como modificadas após upload via drop");
      }
    }
  });

  // Função para marcar uma foto como principal
  const handleSetPrimary = (index: number) => {
    setPrimaryPhotoIndex(index);
    
    // Marcar que houve modificação nas fotos
    if (setPhotosModified) {
      setPhotosModified(true);
      console.log("Fotos marcadas como modificadas - alteração de foto principal");
    }
  };

  // Função para remover uma foto da lista
  const handleRemovePhoto = (index: number) => {
    console.log(`Removendo foto no índice ${index}`);
    
    // Se temos URLs, podemos verificar se estamos removendo uma foto existente para log
    if (photoUrls && index < photoUrls.length && photoUrls[index]) {
      console.log(`A foto removida tem URL: ${photoUrls[index]}`);
      console.log(`Esta URL está nas fotos originais: ${originalPhotoUrls?.includes(photoUrls[index]) ? 'SIM' : 'NÃO'}`);
    }
    
    // Criar novos arrays (importante para garantir reatividade)
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    
    // Também remover da lista de URLs
    if (setPhotoUrls) {
      const newUrls = [...photoUrls];
      newUrls.splice(index, 1); // Remover pelo índice
      setPhotoUrls(newUrls);
      console.log("URLs após remoção de foto:", newUrls);
    }
    
    // Ajustar o índice da foto primária se necessário
    if (primaryPhotoIndex === index) {
      setPrimaryPhotoIndex(newPhotos.length > 0 ? 0 : null);
    } else if (primaryPhotoIndex !== null && primaryPhotoIndex > index) {
      setPrimaryPhotoIndex(primaryPhotoIndex - 1);
    }
    
    // Marcar que houve modificação nas fotos
    if (setPhotosModified) {
      setPhotosModified(true);
      console.log("Fotos marcadas como modificadas - após remoção de foto");
    }
  };

  // Função para adicionar fotos da webcam
  const handleWebcamCapture = (capturedPhotos: File[]) => {
    console.log("Fotos capturadas pela webcam:", capturedPhotos.length);
    
    // Importante: criar um novo array
    const newPhotos = [...photos, ...capturedPhotos];
    setPhotos(newPhotos);
    
    // Também ajustar as URLs - adicionamos undefined para cada nova foto da webcam
    if (setPhotoUrls) {
      const currentUrls = [...photoUrls];
      const newUrls = [...currentUrls, ...Array(capturedPhotos.length).fill(undefined)];
      setPhotoUrls(newUrls);
      console.log("URLs atualizadas após captura de webcam:", newUrls.length);
    }
    
    // Se não houver foto primária definida, define a primeira nova foto
    if (primaryPhotoIndex === null && capturedPhotos.length > 0) {
      setPrimaryPhotoIndex(photos.length);
    }
    
    // Marcar que houve modificação nas fotos
    if (setPhotosModified) {
      setPhotosModified(true);
      console.log("Fotos marcadas como modificadas após captura de webcam");
    }
  };

  // Função para salvar fotos diretamente se itemId estiver disponível
  const handleSaveDirectly = async () => {
    if (!itemId) {
      toast.error("É necessário salvar o item primeiro para anexar fotos.");
      return;
    }
    
    if (photos.length === 0) {
      toast.warning("Nenhuma foto selecionada para upload.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setUploadProgress(0);
      
      // Preparar lista de fotos (combinando URLs existentes e novos arquivos)
      const filesToUpload: (File | string)[] = [];
      
      for (let i = 0; i < photos.length; i++) {
        // Se temos uma URL existente para este índice, usamos ela
        if (i < photoUrls.length && photoUrls[i]) {
          filesToUpload.push(photoUrls[i]);
        } else {
          // Caso contrário, é um novo arquivo
          filesToUpload.push(photos[i]);
        }
      }
      
      // Fazer upload das fotos para o storage
      const results = await uploadMultiplePhotos(
        filesToUpload,
        'inventory_images',
        (progress) => setUploadProgress(progress),
        itemId
      );
      
      // Verificar resultados do upload
      const successfulUploads = results.filter(r => r.success && r.url);
      
      if (successfulUploads.length > 0) {
        // Preparar dados para salvar no banco
        const photoRecords = successfulUploads.map((result, index) => ({
          inventory_id: itemId,
          photo_url: result.url as string,
          is_primary: index === primaryPhotoIndex
        }));
        
        // Remover fotos antigas
        const { error: deleteError } = await supabase
          .from('inventory_photos')
          .delete()
          .eq('inventory_id', itemId);
          
        if (deleteError) {
          console.error("Erro ao excluir fotos antigas:", deleteError);
          toast.error("Erro ao atualizar fotos antigas");
          return;
        }
        
        // Inserir novas fotos
        const { data, error } = await supabase
          .from('inventory_photos')
          .insert(photoRecords)
          .select();
          
        if (error) {
          console.error("Erro ao salvar registros das fotos:", error);
          toast.error("Erro ao salvar informações das fotos");
        } else {
          toast.success(`${successfulUploads.length} foto(s) salva(s) com sucesso!`);
          
          // Atualizar as URLs das fotos para evitar re-upload em edições futuras
          if (setPhotoUrls) {
            setPhotoUrls(successfulUploads.map(result => result.url as string));
          }
          
          // Resetar o flag de modificação
          if (setPhotosModified) {
            setPhotosModified(false);
          }
        }
      } else {
        toast.error("Não foi possível fazer upload das fotos. Tente novamente.");
      }
    } catch (error) {
      console.error('Erro ao salvar fotos:', error);
      toast.error("Erro ao salvar fotos. Verifique as permissões e tente novamente.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
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
                primaryPhotoIndex === index ? 'ring-2 ring-primary' : ''
              }`}
            >
              <img 
                src={
                  // Se temos uma URL para este índice, usamos ela. Caso contrário, criamos uma URL para o arquivo
                  (index < photoUrls.length && photoUrls[index]) 
                    ? photoUrls[index] 
                    : URL.createObjectURL(photo)
                }
                alt={`Foto ${index + 1}`} 
                className="w-full h-32 object-cover"
              />
              
              {/* Badge indicando foto principal */}
              {primaryPhotoIndex === index && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  Principal
                </div>
              )}
              
              {/* Indicador de foto já existente */}
              {photoUrls && index < photoUrls.length && photoUrls[index] && (
                <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Existente
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
                    disabled={disabled}
                  >
                    Definir como principal
                  </Button>
                )}
                <Button 
                  type="button"
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleRemovePhoto(index)}
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
