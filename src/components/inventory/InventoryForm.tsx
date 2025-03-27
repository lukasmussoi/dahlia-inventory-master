
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
    addPhoto,
    addPhotos,
    setPrimaryPhoto,
    removePhoto,
    uploadProgress,
    setUploadProgress,
    savePhotosOnly,
    photosModified,
    setPhotosModified
  } = useInventoryForm({ 
    item, 
    onSuccess, 
    onClose
  });

  // CORREÇÃO DO BUG: Log mais detalhado para monitorar os valores do item
  useEffect(() => {
    if (item) {
      console.log("Item carregado para edição:", {
        id: item.id,
        nome: item.name,
        preco_bruto: item.unit_cost,
        preco_venda: item.price
      });
      
      // CORREÇÃO DO BUG: Verificar o valor no formulário após carregamento
      setTimeout(() => {
        const formValue = form.getValues("unit_cost");
        console.log("Valor do preço bruto no formulário após carregamento:", formValue);
        
        // Verificar se o valor está correto
        if (formValue !== item.unit_cost) {
          console.warn("ATENÇÃO: Valor do preço bruto no formulário diferente do valor no banco!");
          console.warn(`Valor no banco: ${item.unit_cost}, Valor no formulário: ${formValue}`);
        }
      }, 500); // Pequeno delay para garantir que o formulário foi atualizado
    }
  }, [item, form]);

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
    // CORREÇÃO DO BUG: Log para verificar estado atual do formulário antes de fechar
    if (item) {
      const formValue = form.getValues("unit_cost");
      console.log("Valor do preço bruto ao fechar formulário:", formValue);
      console.log("Valor original do item:", item.unit_cost);
    }
    
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

  // CORREÇÃO DO BUG: Log antes de submeter o formulário
  const handleFormSubmit = form.handleSubmit((values) => {
    console.log("Valor do preço bruto antes de submeter:", values.unit_cost);
    return handleSubmit(values);
  });

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
            <form id="inventory-form" onSubmit={handleFormSubmit} className="space-y-4">
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
                addPhoto={addPhoto}
                addPhotos={addPhotos}
                setPrimaryPhoto={setPrimaryPhoto}
                removePhoto={removePhoto}
                uploadProgress={uploadProgress}
                setUploadProgress={setUploadProgress}
                onSavePhotos={savePhotosOnly}
                itemId={item?.id}
                photosModified={photosModified}
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
