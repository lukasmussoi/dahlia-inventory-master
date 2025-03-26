/**
 * JewelryForm - Componente para criação e edição de joias no inventário
 */
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { InventoryModel, PlatingType, Supplier, InventoryItem, InventoryCategory } from "@/models/inventoryModel";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { PriceSummary } from "./form/PriceSummary";
import { PhotoFields } from "./form/PhotoFields";
import { uploadMultiplePhotos } from "@/utils/photoUploadUtils";
import { supabase } from "@/integrations/supabase/client";

// Schema de validação do formulário
const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  category_id: z.string().min(1, "Categoria é obrigatória"),
  plating_type_id: z.string().min(1, "Tipo de banho é obrigatório"),
  supplier_id: z.string().optional(),
  material_weight: z.number().min(0.01, "Peso deve ser maior que 0"),
  packaging_cost: z.number().min(0, "Custo não pode ser negativo").default(0),
  raw_cost: z.number().min(0, "Custo não pode ser negativo"),
  quantity: z.number().int().min(0, "Quantidade não pode ser negativa"),
  min_stock: z.number().int().min(0, "Estoque mínimo não pode ser negativo"),
  markup_percentage: z.number().min(0, "Markup não pode ser negativo").default(30),
  price: z.number().min(0, "Preço não pode ser negativo"),
});

type FormValues = z.infer<typeof formSchema>;

interface JewelryFormProps {
  item?: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (item: InventoryItem) => void;
}

export function JewelryForm({ item, isOpen, onClose, onSuccess }: JewelryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Inicializar formulário com valores padrão
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || "",
      category_id: item?.category_id || "",
      plating_type_id: item?.plating_type_id || "",
      supplier_id: item?.supplier_id || "",
      material_weight: item?.material_weight || 0,
      packaging_cost: item?.packaging_cost || 0,
      raw_cost: item?.unit_cost || 0,
      quantity: item?.quantity || 0,
      min_stock: item?.min_stock || 0,
      markup_percentage: item?.markup_percentage || 30,
      price: item?.price || 0,
    },
  });

  // Buscar dados necessários
  const { data: categories = [] } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: () => InventoryModel.getAllCategories(),
  });

  const { data: platingTypes = [] } = useQuery({
    queryKey: ['plating-types'],
    queryFn: () => InventoryModel.getAllPlatingTypes(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => InventoryModel.getAllSuppliers(),
  });

  // Carregar fotos existentes se estiver editando um item
  useEffect(() => {
    if (item && item.photos && item.photos.length > 0) {
      const loadExistingPhotos = async () => {
        try {
          const photoFiles: File[] = [];
          let primaryIndex = null;
          
          for (let i = 0; i < item.photos.length; i++) {
            const photo = item.photos[i];
            try {
              // Fetch da imagem para converter para blob
              const response = await fetch(photo.photo_url);
              const blob = await response.blob();
              
              // Extrair nome do arquivo da URL
              const urlParts = photo.photo_url.split('/');
              const fileName = urlParts[urlParts.length - 1] || `photo_${i}.jpg`;
              
              // Criar objeto File
              const file = new File([blob], fileName, { 
                type: blob.type || 'image/jpeg',
                lastModified: new Date().getTime()
              });
              
              photoFiles.push(file);
              
              // Verificar se é a foto primária
              if (photo.is_primary) {
                primaryIndex = i;
              }
            } catch (error) {
              console.error(`Erro ao carregar foto ${photo.photo_url}:`, error);
            }
          }
          
          setPhotos(photoFiles);
          setPrimaryPhotoIndex(primaryIndex !== null ? primaryIndex : (photoFiles.length > 0 ? 0 : null));
          
        } catch (error) {
          console.error('Erro ao carregar fotos existentes:', error);
          toast.error("Não foi possível carregar as fotos existentes");
        }
      };
      
      loadExistingPhotos();
    }
  }, [item]);

  // Calcular valores em tempo real
  const calculatedValues = useMemo(() => {
    const rawCost = form.watch('raw_cost') || 0;
    const packagingCost = form.watch('packaging_cost') || 0;
    const materialWeight = form.watch('material_weight') || 0;
    const markup = form.watch('markup_percentage') || 30;
    const price = form.watch('price') || 0;
    
    const selectedPlatingType = platingTypes.find(pt => pt.id === form.watch('plating_type_id'));
    const platingCost = selectedPlatingType ? materialWeight * selectedPlatingType.gram_value : 0;
    
    const totalCost = rawCost + platingCost + packagingCost;
    const suggestedPrice = totalCost * (1 + markup / 100);
    const profit = price - totalCost;

    return {
      totalCost,
      suggestedPrice,
      profit,
    };
  }, [
    form.watch('raw_cost'),
    form.watch('packaging_cost'),
    form.watch('material_weight'),
    form.watch('markup_percentage'),
    form.watch('price'),
    form.watch('plating_type_id'),
    platingTypes
  ]);

  // Função para salvar apenas as fotos, sem submeter o resto do formulário
  const handleSavePhotosOnly = async () => {
    if (!item) {
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
      
      // Fazer upload das fotos para o storage
      const results = await uploadMultiplePhotos(
        photos,
        'inventory_images',
        (progress) => setUploadProgress(progress),
        item.id
      );
      
      // Verificar resultados do upload
      const successfulUploads = results.filter(r => r.success && r.url);
      
      if (successfulUploads.length > 0) {
        // Preparar dados para salvar no banco
        const photoRecords = successfulUploads.map((result, index) => ({
          inventory_id: item.id,
          photo_url: result.url as string,
          is_primary: index === primaryPhotoIndex
        }));
        
        // Remover fotos antigas
        const { error: deleteError } = await supabase
          .from('inventory_photos')
          .delete()
          .eq('inventory_id', item.id);
          
        if (deleteError) {
          console.error("Erro ao excluir fotos antigas:", deleteError);
          toast.error("Erro ao atualizar fotos antigas");
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

  const handleSubmit = async (values: FormValues) => {
    try {
      console.log("Iniciando submissão do formulário", values);
      setIsSubmitting(true);

      if (photos.length > 5) {
        toast.error("Máximo de 5 fotos permitido");
        return;
      }

      // Validar categoria
      if (!values.category_id) {
        toast.error("Selecione uma categoria");
        return;
      }

      const itemData = {
        name: values.name,
        category_id: values.category_id,
        plating_type_id: values.plating_type_id,
        supplier_id: values.supplier_id || null,
        material_weight: values.material_weight,
        packaging_cost: values.packaging_cost,
        unit_cost: calculatedValues.totalCost,
        price: values.price,
        quantity: values.quantity,
        min_stock: values.min_stock,
        markup_percentage: values.markup_percentage,
        suggested_price: calculatedValues.suggestedPrice,
      };

      console.log("Dados preparados para salvamento:", itemData);

      let createdOrUpdatedItem: InventoryItem | null = null;
      
      // Restante da função de submissão
      if (item) {
        console.log("Atualizando item existente");
        createdOrUpdatedItem = await InventoryModel.updateItem(item.id, itemData);
        toast.success("Peça atualizada com sucesso!");
      } else {
        console.log("Criando novo item");
        createdOrUpdatedItem = await InventoryModel.createItem(itemData);
        console.log("Item criado:", createdOrUpdatedItem);
        toast.success("Peça criada com sucesso!");
      }
      
      // Se temos fotos e um item criado/atualizado, fazer upload das fotos
      if (photos.length > 0 && createdOrUpdatedItem) {
        const uploadResults = await uploadMultiplePhotos(
          photos,
          'inventory_images',
          (progress) => setUploadProgress(progress),
          createdOrUpdatedItem.id
        );
        
        const successfulUploads = uploadResults.filter(r => r.success && r.url);
        
        if (successfulUploads.length > 0) {
          const photoRecords = successfulUploads.map((result, index) => ({
            inventory_id: createdOrUpdatedItem!.id,
            photo_url: result.url as string,
            is_primary: index === primaryPhotoIndex
          }));
          
          // Salvar registros das fotos no banco
          const { data, error } = await supabase
            .from('inventory_photos')
            .insert(photoRecords)
            .select();
            
          if (error) {
            console.error("Erro ao salvar registros das fotos:", error);
          } else {
            console.log("Fotos salvas com sucesso:", data);
            createdOrUpdatedItem.photos = data;
          }
        }
      }
      
      if (onSuccess && createdOrUpdatedItem) {
        onSuccess(createdOrUpdatedItem);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar peça:', error);
      toast.error("Erro ao salvar peça. Verifique os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Monitorar erros do formulário
  useEffect(() => {
    const subscription = form.watch(() => {
      const errors = form.formState.errors;
      if (Object.keys(errors).length > 0) {
        console.log("Erros de validação:", errors);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Função para lidar com fotos capturadas pela webcam
  const handleWebcamCapture = (capturedPhotos: File[]) => {
    setPhotos((prev) => [...prev, ...capturedPhotos]);
    
    // Se não houver foto primária definida, define a primeira nova foto
    if (primaryPhotoIndex === null && capturedPhotos.length > 0) {
      setPrimaryPhotoIndex(photos.length);
    }
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

  // Função para definir foto principal
  const handleSetPrimaryPhoto = (index: number) => {
    setPrimaryPhotoIndex(index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] h-auto flex flex-col p-6 gap-4">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl">
            {item ? "Editar Peça" : "Nova Peça"}
          </DialogTitle>
          <DialogDescription className="text-base">
            Preencha os dados da peça. Os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-[1fr_350px] gap-6 overflow-hidden h-full">
          {/* Coluna principal - Formulário */}
          <div className="overflow-y-auto pr-2">
            <Form {...form}>
              <form id="jewelry-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Formulário: seções de informações básicas, custos e precificação */}
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-medium mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Peça *</Label>
                      <Input 
                        id="name"
                        placeholder="Ex: Anel Solitário"
                        {...form.register('name')}
                        className="h-12"
                      />
                      {form.formState.errors.name && (
                        <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria *</Label>
                      <Select 
                        onValueChange={(value) => form.setValue('category_id', value)}
                        value={form.watch('category_id')}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.category_id && (
                        <p className="text-red-500 text-sm">{form.formState.errors.category_id.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plating_type">Tipo de Banho *</Label>
                      <Select 
                        onValueChange={(value) => form.setValue('plating_type_id', value)}
                        value={form.watch('plating_type_id')}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione o tipo de banho" />
                        </SelectTrigger>
                        <SelectContent>
                          {platingTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} - R$ {type.gram_value.toFixed(2)}/g
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.plating_type_id && (
                        <p className="text-red-500 text-sm">{form.formState.errors.plating_type_id.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplier">Fornecedor</Label>
                      <Select
                        onValueChange={(value) => form.setValue('supplier_id', value)}
                        value={form.watch('supplier_id')}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-medium mb-4">Custos e Pesos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="raw_cost">Preço do Bruto (R$) *</Label>
                      <Input
                        id="raw_cost"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="h-12"
                        {...form.register('raw_cost', { valueAsNumber: true })}
                      />
                      {form.formState.errors.raw_cost && (
                        <p className="text-red-500 text-sm">{form.formState.errors.raw_cost.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="material_weight">Peso (g) *</Label>
                      <Input
                        id="material_weight"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="h-12"
                        {...form.register('material_weight', { valueAsNumber: true })}
                      />
                      {form.formState.errors.material_weight && (
                        <p className="text-red-500 text-sm">{form.formState.errors.material_weight.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="packaging_cost">Custo da Embalagem (R$)</Label>
                      <Input
                        id="packaging_cost"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="h-12"
                        {...form.register('packaging_cost', { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade em Estoque *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="0"
                        className="h-12"
                        {...form.register('quantity', { valueAsNumber: true })}
                      />
                      {form.formState.errors.quantity && (
                        <p className="text-red-500 text-sm">{form.formState.errors.quantity.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min_stock">Estoque Mínimo *</Label>
                      <Input
                        id="min_stock"
                        type="number"
                        placeholder="0"
                        className="h-12"
                        {...form.register('min_stock', { valueAsNumber: true })}
                      />
                      {form.formState.errors.min_stock && (
                        <p className="text-red-500 text-sm">{form.formState.errors.min_stock.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-medium mb-4">Precificação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="markup_percentage">Markup (%) *</Label>
                      <Input
                        id="markup_percentage"
                        type="number"
                        step="0.1"
                        placeholder="30.0"
                        className="h-12"
                        {...form.register('markup_percentage', { valueAsNumber: true })}
                      />
                      {form.formState.errors.markup_percentage && (
                        <p className="text-red-500 text-sm">{form.formState.errors.markup_percentage.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Preço Final (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-12"
                        {...form.register('price', { valueAsNumber: true })}
                      />
                      {form.formState.errors.price && (
                        <p className="text-red-500 text-sm">{form.formState.errors.price.message}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Preço sugerido: R$ {calculatedValues.suggestedPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>

          {/* Coluna lateral - Fotos e Resumo */}
          <div className="flex flex-col gap-6">
            {/* Seção de fotos - implementação completa com PhotoFields */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-medium">Fotos da Peça</Label>
                <Button 
                  type="button" 
                  size="sm"
                  variant="outline"
                  onClick={handleSavePhotosOnly}
                  disabled={photos.length === 0 || isSubmitting}
                >
                  Salvar Fotos
                </Button>
              </div>

              {/* Usar PhotoFields para gerenciar fotos */}
              <PhotoFields 
                form={form}
                photos={photos}
                setPhotos={setPhotos}
                primaryPhotoIndex={primaryPhotoIndex}
                setPrimaryPhotoIndex={setPrimaryPhotoIndex}
                uploadProgress={uploadProgress}
                setUploadProgress={setUploadProgress}
                onSavePhotos={handleSavePhotosOnly}
              />
            </div>

            <PriceSummary
              totalCost={calculatedValues.totalCost}
              finalPrice={form.watch('price') || 0}
              finalProfit={calculatedValues.profit}
              suggestedPrice={calculatedValues.suggestedPrice}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose} className="h-12 px-6 text-base">
            Cancelar
          </Button>
          <Button 
            type="submit"
            form="jewelry-form"
            className="bg-[#F97316] hover:bg-[#F97316]/90 h-12 px-8 text-base font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
