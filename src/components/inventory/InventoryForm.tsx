
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InventoryItem, InventoryCategory, Supplier, InventoryModel } from "@/models/inventory";
import { MainFields } from "./form/MainFields";
import { DimensionsFields } from "./form/DimensionsFields";
import { PhotoFields } from "./form/PhotoFields";
import { useInventoryForm } from "@/hooks/useInventoryForm";

interface InventoryFormProps {
  item?: InventoryItem | null;
  categories: InventoryCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (item: InventoryItem) => void;
}

export function InventoryForm({ item, categories, isOpen, onClose, onSuccess }: InventoryFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { 
    form, 
    isSubmitting, 
    handleSubmit,
    photos,
    setPhotos,
    primaryPhotoIndex,
    setPrimaryPhotoIndex,
    uploadProgress,
    setUploadProgress,
    savePhotosOnly,
    photoUrls,
    setPhotoUrls,
    photosModified,
    setPhotosModified
  } = useInventoryForm({ 
    item, 
    onSuccess, 
    onClose
  });

  useEffect(() => {
    if (isOpen) {
      const loadSuppliers = async () => {
        try {
          const data = await InventoryModel.getAllSuppliers();
          setSuppliers(data);
        } catch (error) {
          console.error('Erro ao carregar fornecedores:', error);
          toast.error("Erro ao carregar fornecedores");
        }
      };
  
      loadSuppliers();
    }
  }, [isOpen]);

  // Função para gerenciar o fechamento seguro
  const handleCloseForm = () => {
    // Verificar se há fotos não enviadas
    if (photosModified && photos.length > 0 && !isSubmitting) {
      // Perguntar ao usuário se ele quer fechar sem salvar (usando Toast interativo)
      toast.custom((toastId) => (
        <div className="bg-white rounded-lg p-4 shadow-lg border">
          <p className="mb-3">Você tem alterações nas fotos não salvas. Deseja salvar antes de fechar?</p>
          <div className="flex justify-end gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                toast.dismiss(toastId);
                onClose();
              }}
            >
              Fechar sem salvar
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              onClick={() => {
                toast.dismiss(toastId);
                savePhotosOnly();
                onClose();
              }}
            >
              Salvar fotos e fechar
            </Button>
          </div>
        </div>
      ), { duration: 10000 });
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseForm}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar Item" : "Novo Item"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do item do estoque. Os campos de dimensões são opcionais.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1 pb-4">
          <Form {...form}>
            <form id="inventory-form" onSubmit={handleSubmit} className="space-y-4">
              <MainFields 
                form={form}
                categories={categories}
                suppliers={suppliers}
              />
              <DimensionsFields form={form} />
              <PhotoFields
                form={form}
                photos={photos}
                setPhotos={setPhotos}
                primaryPhotoIndex={primaryPhotoIndex}
                setPrimaryPhotoIndex={setPrimaryPhotoIndex}
                uploadProgress={uploadProgress}
                setUploadProgress={setUploadProgress}
                onSavePhotos={savePhotosOnly}
                photoUrls={photoUrls}
                setPhotoUrls={setPhotoUrls}
                setPhotosModified={setPhotosModified}
              />
            </form>
          </Form>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleCloseForm}>
            Cancelar
          </Button>
          <Button 
            type="submit"
            form="inventory-form"
            className="bg-gold hover:bg-gold/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
