
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
import { InventoryItem, InventoryCategory, Supplier, InventoryModel } from "@/models/inventoryModel";
import { MainFields } from "./form/MainFields";
import { DimensionsFields } from "./form/DimensionsFields";
import { PhotoFields } from "./form/PhotoFields";
import { useInventoryForm } from "@/hooks/useInventoryForm";

interface InventoryFormProps {
  item?: InventoryItem | null;
  categories: InventoryCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InventoryForm({ item, categories, isOpen, onClose, onSuccess }: InventoryFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { 
    form, 
    isSubmitting, 
    onSubmit,
    photos,
    setPhotos,
    primaryPhotoIndex,
    setPrimaryPhotoIndex 
  } = useInventoryForm({ item, onSuccess, onClose });

  useEffect(() => {
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
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            <form onSubmit={onSubmit} className="space-y-4">
              <MainFields 
                form={form}
                categories={categories}
                suppliers={suppliers}
              />
              <DimensionsFields form={form} />
              <PhotoFields
                photos={photos}
                setPhotos={setPhotos}
                primaryPhotoIndex={primaryPhotoIndex}
                setPrimaryPhotoIndex={setPrimaryPhotoIndex}
              />
            </form>
          </Form>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
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
