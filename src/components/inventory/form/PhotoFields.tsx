
/**
 * Este componente gerencia a adição, remoção e visualização de fotos
 * para itens do inventário. Permite upload de arquivos e captura via webcam.
 * 
 * Relaciona-se com:
 * - InventoryForm.tsx / JewelryForm.tsx (componentes pais)
 * - WebcamButton.tsx para captura de fotos via webcam
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Camera, Save } from "lucide-react";
import { WebcamButton } from "@/components/ui/webcam-button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { uploadMultiplePhotos } from "@/utils/photoUploadUtils";

interface PhotoFieldsProps {
  photos: File[];
  setPhotos: (photos: File[]) => void;
  primaryPhotoIndex: number | null;
  setPrimaryPhotoIndex: (index: number | null) => void;
  uploadProgress?: number;
  setUploadProgress?: (progress: number) => void;
  onSavePhotos?: () => void;
}

export function PhotoFields({
  photos,
  setPhotos,
  primaryPhotoIndex,
  setPrimaryPhotoIndex,
  uploadProgress = 0,
  setUploadProgress,
  onSavePhotos
}: PhotoFieldsProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Manipuladores de eventos para arrastar e soltar
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Manipulador para quando arquivos são soltos na área de arrastar
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(
        file => file.type.startsWith("image/")
      );
      
      if (newFiles.length > 0) {
        handleFilesAdded(newFiles);
      }
    }
  };

  // Manipulador para quando arquivos são selecionados pelo input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(
        file => file.type.startsWith("image/")
      );
      
      if (newFiles.length > 0) {
        handleFilesAdded(newFiles);
      }
    }
  };

  // Função auxiliar para adicionar novos arquivos
  const handleFilesAdded = (newFiles: File[]) => {
    setPhotos([...photos, ...newFiles]);
    
    // Se for a primeira foto, definir como primária automaticamente
    if (photos.length === 0 && primaryPhotoIndex === null) {
      setPrimaryPhotoIndex(0);
    }
  };

  // Remover uma foto
  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
    
    // Ajustar o índice da foto primária se necessário
    if (primaryPhotoIndex === index) {
      setPrimaryPhotoIndex(newPhotos.length > 0 ? 0 : null);
    } else if (primaryPhotoIndex !== null && primaryPhotoIndex > index) {
      setPrimaryPhotoIndex(primaryPhotoIndex - 1);
    }
  };

  // Definir uma foto como primária
  const setPrimary = (index: number) => {
    setPrimaryPhotoIndex(index);
  };

  // Manipulador para receber fotos da webcam
  const handleWebcamPhotos = (webcamPhotos: File[]) => {
    handleFilesAdded(webcamPhotos);
  };

  // Função para salvar fotos manualmente
  const handleSavePhotos = async () => {
    if (photos.length === 0) {
      toast.warning("Nenhuma foto para salvar. Adicione fotos primeiro.");
      return;
    }

    try {
      setIsSaving(true);
      
      // Usar a função uploadMultiplePhotos para salvar as fotos no Supabase
      const results = await uploadMultiplePhotos(
        photos, 
        'inventory_images',
        (progress) => {
          if (setUploadProgress) {
            setUploadProgress(progress);
          }
        }
      );
      
      // Verificar erros no upload
      const errors = results.filter(result => !result.success);
      
      if (errors.length > 0) {
        toast.error(`Erro ao enviar ${errors.length} foto(s). Tente novamente.`);
        console.error("Erros no upload:", errors);
      } else {
        toast.success(`${results.length} foto(s) salva(s) com sucesso!`);
        
        // Chamar callback se fornecido
        if (onSavePhotos) {
          onSavePhotos();
        }
      }
    } catch (error) {
      console.error("Erro ao salvar fotos:", error);
      toast.error("Erro ao salvar fotos. Tente novamente.");
    } finally {
      setIsSaving(false);
      if (setUploadProgress) {
        setUploadProgress(0);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Área de arrastar e soltar + upload de arquivos */}
      <div
        className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <label
          htmlFor="photo-upload"
          className="flex flex-col items-center cursor-pointer py-2"
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium mb-1">
            Arraste e solte suas fotos aqui ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground">
            Formatos suportados: JPG, PNG, GIF (máx. 5MB por arquivo)
          </p>
        </label>
      </div>

      {/* Botões para captura de fotos via webcam e salvar fotos */}
      <div className="flex justify-between">
        <WebcamButton onCaptureComplete={handleWebcamPhotos} />
        
        {photos.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3"
            onClick={handleSavePhotos}
            disabled={isSaving || photos.length === 0}
            title="Salvar fotos no servidor"
          >
            <Save size={16} className="mr-1" />
            <span className="text-xs">
              {isSaving ? "Salvando..." : "Salvar Fotos"}
            </span>
          </Button>
        )}
      </div>

      {/* Progresso de upload */}
      {uploadProgress > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Enviando fotos: {uploadProgress}%</p>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Lista de fotos */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Fotos ({photos.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div
                key={index}
                className={`group relative rounded-md overflow-hidden border-2 ${
                  index === primaryPhotoIndex
                    ? "border-primary ring-1 ring-primary"
                    : "border-border"
                }`}
              >
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {index !== primaryPhotoIndex && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setPrimary(index)}
                      className="text-xs h-8"
                    >
                      Principal
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removePhoto(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {index === primaryPhotoIndex && (
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-sm">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
