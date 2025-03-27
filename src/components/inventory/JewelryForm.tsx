
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
  const [savedItem, setSavedItem] = useState<InventoryItem | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

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

  // Usar o item salvo ou o item original para o ID
  const currentItemId = savedItem?.id || item?.id;

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
          const urls: string[] = [];
          
          for (let i = 0; i < item.photos.length; i++) {
            const photo = item.photos[i];
            try {
              // Armazenar a URL original
              urls.push(photo.photo_url);
              
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
          setPhotoUrls(urls);
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
    if (!currentItemId) {
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
      
      // Preparar as fotos para upload (mistura de URLs existentes e novos arquivos)
      const filesToUpload: (File | string)[] = [];
      
      for (let i = 0; i < photos.length; i++) {
        // Se temos uma URL existente para este índice, usamos ela
        if (photoUrls[i]) {
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
        currentItemId
      );
      
      // Verificar resultados do upload
      const successfulUploads = results.filter(r => r.success && r.url);
      
      if (successfulUploads.length > 0) {
        // Preparar dados para salvar no banco
        const photoRecords = successfulUploads.map((result, index) => ({
          inventory_id: currentItemId,
          photo_url: result.url as string,
          is_primary: index === primaryPhotoIndex
        }));
        
        // Remover fotos antigas
        const { error: deleteError } = await supabase
          .from('inventory_photos')
          .delete()
          .eq('inventory_id', currentItemId);
          
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
          
          // Atualizar as URLs das fotos no estado local para uso futuro
          setPhotoUrls(successfulUploads.map(result => result.url as string));
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
      
      // Importante: definir explicitamente barcode e sku como null para evitar 
      // erro de duplicidade ao criar novo item
      if (!item) {
        // No modo de criação, certifique-se de não enviar barcode ou sku
        // Deixe isso ser gerado pelo gatilho no banco de dados
        const createData = {
          ...itemData,
          barcode: undefined, // Remover do objeto para deixar o trigger gerar
          sku: undefined,     // Remover do objeto para deixar o trigger gerar
        };
        
        console.log("Criando novo item");
        createdOrUpdatedItem = await InventoryModel.createItem(createData);
        console.log("Item criado:", createdOrUpdatedItem);
        toast.success("Peça criada com sucesso!");
        
        // Armazenar o item criado para uso posterior
        setSavedItem(createdOrUpdatedItem);
      } else {
        console.log("Atualizando item existente");
        createdOrUpdatedItem = await InventoryModel.updateItem(item.id, itemData);
        toast.success("Peça atualizada com sucesso!");
      }
      
      // Se temos fotos e um item criado/atualizado, fazer upload das fotos
      if (photos.length > 0 && createdOrUpdatedItem) {
        // Preparar para upload combinando URLs existentes com novos arquivos
        const filesToUpload: (File | string)[] = [];
        
        for (let i = 0; i < photos.length; i++) {
          if (photoUrls[i]) {
            // Se temos uma URL existente, reutilizamos ela
            filesToUpload.push(photoUrls[i]);
          } else {
            // Caso contrário é um novo arquivo
            filesToUpload.push(photos[i]);
          }
        }
        
        const uploadResults = await uploadMultiplePhotos(
          filesToUpload,
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
            
            // Atualizar URLs para uso futuro
            setPhotoUrls(successfulUploads.map(result => result.url as string));
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
      if (error instanceof Error) {
        // Verificar mensagem específica de erro para barcode duplicado
        if (error.message?.includes('duplicate key') && error.message?.includes('inventory_barcode_key')) {
          toast.error("Erro: código de barras duplicado. Tente novamente ou use um código diferente.");
        } else {
          toast.error(`Erro ao salvar peça: ${error.message}`);
        }
      } else {
        toast.error("Erro ao salvar peça. Verifique os dados e tente novamente.");
      }
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
                <div className="bg-white rounded-lg p-6 shadow-sm border border-zinc-200">
                  <h3 className="text-lg font-medium mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Nome da Peça *</Label>
                      <Input 
                        id="name"
                        placeholder="Ex: Anel Solitário"
                        {...form.register('name')}
                        className="h-11"
                      />
                      {form.formState.errors.name && (
                        <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium">Categoria *</Label>
                      <Select 
                        onValueChange={(value) => form.setValue('category_id', value)}
                        value={form.watch('category_id')}
                      >
                        <SelectTrigger className="h-11">
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
                      <Label htmlFor="plating_type" className="text-sm font-medium">Tipo de Banho *</Label>
                      <Select 
                        onValueChange={(value) => form.setValue('plating_type_id', value)}
                        value={form.watch('plating_type_id')}
                      >
                        <SelectTrigger className="h-11">
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
                      <Label htmlFor="supplier" className="text-sm font-medium">Fornecedor</Label>
                      <Select
                        onValueChange={(value) => form.setValue('supplier_id', value)}
                        value={form.watch('supplier_id')}
                      >
                        <SelectTrigger className="h-11">
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

                <div className="bg-white rounded-lg p-6 shadow-sm border border-zinc-200">
                  <h3 className="text-lg font-medium mb-4">Custos e Pesos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="raw_cost" className="text-sm font-medium">Preço do Bruto (R$) *</Label>
                      <Input
                        id="raw_cost"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="h-11"
                        {...form.register('raw_cost', { valueAsNumber: true })}
                      />
                      {form.formState.errors.raw_cost && (
                        <p className="text-red-500 text-sm">{form.formState.errors.raw_cost.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="material_weight" className="text-sm font-medium">Peso (g) *</Label>
                      <Input
                        id="material_weight"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="h-11"
                        {...form.register('material_weight', { valueAsNumber: true })}
                      />
                      {form.formState.errors.material_weight && (
                        <p className="text-red-500 text-sm">{form.formState.errors.material_weight.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="packaging_cost" className="text-sm font-medium">Custo da Embalagem (R$)</Label>
                      <Input
                        id="packaging_cost"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="h-11"
                        {...form.register('packaging_cost', { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-sm font-medium">Quantidade em Estoque *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="0"
                        className="h-11"
                        {...form.register('quantity', { valueAsNumber: true })}
                      />
                      {form.formState.errors.quantity && (
                        <p className="text-red-500 text-sm">{form.formState.errors.quantity.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min_stock" className="text-sm font-medium">Estoque Mínimo *</Label>
                      <Input
                        id="min_stock"
                        type="number"
                        placeholder="0"
                        className="h-11"
                        {...form.register('min_stock', { valueAsNumber: true })}
                      />
                      {form.formState.errors.min_stock && (
                        <p className="text-red-500 text-sm">{form.formState.errors.min_stock.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-zinc-200">
                  <h3 className="text-lg font-medium mb-4">Precificação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="markup_percentage" className="text-sm font-medium">Markup (%) *</Label>
                      <Input
                        id="markup_percentage"
                        type="number"
                        step="0.1"
                        placeholder="30.0"
                        className="h-11"
                        {...form.register('markup_percentage', { valueAsNumber: true })}
                      />
                      {form.formState.errors.markup_percentage && (
                        <p className="text-red-500 text-sm">{form.formState.errors.markup_percentage.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">Preço Final (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-11"
                        {...form.register('price', { valueAsNumber: true })}
                      />
                      {form.formState.errors.price && (
                        <p className="text-red-500 text-sm">{form.formState.errors.price.message}</p>
                      )}
                    </div>
                  </div>
                </div>

              </form>
            </Form>
          </div>

          {/* Coluna lateral - Fotos e sumário */}
          <div className="overflow-y-auto space-y-6">
            {/* Seção de fotos */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-zinc-200">
              <PhotoFields 
                photos={photos}
                setPhotos={setPhotos}
                primaryPhotoIndex={primaryPhotoIndex}
                setPrimaryPhotoIndex={setPrimaryPhotoIndex}
                uploadProgress={uploadProgress}
                setUploadProgress={setUploadProgress}
                onSavePhotos={handleSavePhotosOnly}
                itemId={currentItemId}
                disabled={isSubmitting}
                photoUrls={photoUrls}
                setPhotoUrls={setPhotoUrls}
              />
            </div>

            {/* Resumo do produto */}
            <PriceSummary 
              totalCost={calculatedValues.totalCost}
              finalPrice={form.watch('price') || 0}
              finalProfit={calculatedValues.profit}
              suggestedPrice={calculatedValues.suggestedPrice}
            />

            {/* Botões de ação */}
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                form="jewelry-form"
                className="min-w-[120px] bg-orange-500 hover:bg-orange-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    <span>Salvando...</span>
                  </div>
                ) : (
                  <span>{item ? "Atualizar" : "Salvar"}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
