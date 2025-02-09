
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { ImageIcon, StarIcon } from "lucide-react";
import { toast } from "sonner";

interface PhotoFieldsProps {
  photos: File[];
  setPhotos: (photos: File[]) => void;
  primaryPhotoIndex: number | null;
  setPrimaryPhotoIndex: (index: number | null) => void;
}

export function PhotoFields({ photos, setPhotos, primaryPhotoIndex, setPrimaryPhotoIndex }: PhotoFieldsProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    // Limpar URLs antigas
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    // Criar novas URLs de preview
    const urls = photos.map(photo => URL.createObjectURL(photo));
    setPreviewUrls(urls);

    // Cleanup
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [photos]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + photos.length > 5) {
      toast.error("Máximo de 5 fotos permitido");
      return;
    }

    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error("Apenas arquivos de imagem são permitidos");
      return;
    }

    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);

    if (primaryPhotoIndex === index) {
      setPrimaryPhotoIndex(null);
    } else if (primaryPhotoIndex !== null && primaryPhotoIndex > index) {
      setPrimaryPhotoIndex(primaryPhotoIndex - 1);
    }
  };

  const setPrimaryPhoto = (index: number) => {
    setPrimaryPhotoIndex(index);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Fotos (máximo 5)</Label>
        <div className="mt-2">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="photo-input"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('photo-input')?.click()}
            disabled={photos.length >= 5}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Adicionar Fotos
          </Button>
        </div>
      </div>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          {previewUrls.map((url, index) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => setPrimaryPhoto(index)}
                >
                  <StarIcon 
                    className={`w-4 h-4 ${primaryPhotoIndex === index ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`}
                  />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => removePhoto(index)}
                >
                  ✕
                </Button>
              </div>
              {primaryPhotoIndex === index && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-xs px-1 rounded-bl-lg rounded-tr-lg">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
