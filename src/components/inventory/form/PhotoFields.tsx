
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { ImageIcon, StarIcon, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface PhotoFieldsProps {
  photos: File[];
  setPhotos: (photos: File[]) => void;
  primaryPhotoIndex: number | null;
  setPrimaryPhotoIndex: (index: number | null) => void;
}

export function PhotoFields({ photos, setPhotos, primaryPhotoIndex, setPrimaryPhotoIndex }: PhotoFieldsProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length + photos.length > 5) {
        toast.error("Máximo de 5 fotos permitido");
        return;
      }
      setPhotos([...photos, ...acceptedFiles]);
    },
    onDropRejected: () => {
      toast.error("Arquivo inválido. Envie apenas imagens.");
    }
  });

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

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 cursor-pointer
          transition-colors duration-200 text-center
          ${isDragActive ? 'border-gold bg-gold/10' : 'border-gray-300 hover:border-gold'}
        `}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          {isDragActive ? (
            "Solte as imagens aqui..."
          ) : (
            <>
              Arraste e solte as fotos aqui, ou <span className="text-gold">clique para selecionar</span>
              <br />
              <span className="text-xs text-gray-500">(Máximo 5 fotos)</span>
            </>
          )}
        </p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {photos.map((photo, index) => (
            <div key={URL.createObjectURL(photo)} className="relative group aspect-square">
              <img
                src={URL.createObjectURL(photo)}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => setPrimaryPhotoIndex(index)}
                >
                  <StarIcon 
                    className={`w-6 h-6 ${primaryPhotoIndex === index ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`}
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
                <div className="absolute top-0 right-0 bg-yellow-400 text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">
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
