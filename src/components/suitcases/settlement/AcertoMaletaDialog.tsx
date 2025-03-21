
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { AcertoMaletaController } from "@/controllers/acertoMaletaController";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader, RefreshCw } from "lucide-react";
import { SuitcaseSettlementFormData } from "@/types/suitcase";

const formSchema = z.object({
  settlement_date: z.date({
    required_error: "Selecione a data do acerto.",
  }),
  next_settlement_date: z.date({
    required_error: "Selecione a data do próximo acerto.",
  }),
  customer_name: z.string().optional(),
  payment_method: z.string().optional(),
});

interface AcertoMaletaDialogProps {
  suitcaseId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAcertoCompleted?: () => void;
}

export function AcertoMaletaDialog({ suitcaseId, open, onOpenChange, onAcertoCompleted }: AcertoMaletaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suitcase, setSuitcase] = useState<any>(null);
  const [suitcaseItems, setSuitcaseItems] = useState<any[]>([]);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [scannedItemsStatus, setScannedItemsStatus] = useState<{ [key: string]: boolean }>({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Carregar dados da maleta e itens
  useEffect(() => {
    const loadData = async () => {
      try {
        const suitcaseData = await SuitcaseController.getSuitcaseById(suitcaseId);
        setSuitcase(suitcaseData);

        const items = await SuitcaseController.getSuitcaseItems(suitcaseId);
        setSuitcaseItems(items);
        setScannedItems(items);

        // Inicializar todos os itens como "não presentes" por padrão
        const initialStatus: { [key: string]: boolean } = {};
        items.forEach(item => {
          initialStatus[item.id] = false;
        });
        setScannedItemsStatus(initialStatus);
      } catch (error) {
        console.error("Erro ao carregar dados da maleta:", error);
        toast.error("Erro ao carregar dados da maleta");
      }
    };

    loadData();
  }, [suitcaseId]);

  // Formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      settlement_date: new Date(),
      next_settlement_date: new Date(),
      customer_name: "",
      payment_method: "",
    },
  });

  // Função para adicionar item escaneado
  const handleScanItem = async (itemId: string) => {
    setIsScanning(true);
    setScanError(null);

    try {
      const item = await SuitcaseController.getSuitcaseItems(suitcaseId);
      const foundItem = item.find((item: any) => item.id === itemId);

      if (!foundItem) {
        setScanError("Item não encontrado na maleta");
        return;
      }

      // Adicionar item à lista de escaneados se ainda não estiver lá
      if (!scannedItems.find(item => item.id === itemId)) {
        setScannedItems(prevItems => [...prevItems, foundItem]);
      }

      // Atualizar o status do item como "presente"
      setScannedItemsStatus(prevStatus => ({
        ...prevStatus,
        [itemId]: true,
      }));
    } catch (error) {
      console.error("Erro ao escanear item:", error);
      setScanError("Erro ao escanear item");
    } finally {
      setIsScanning(false);
    }
  };

  // Função para atualizar o status de um item escaneado
  const handleItemStatusChange = (itemId: string, isPresent: boolean) => {
    setScannedItemsStatus(prevStatus => ({
      ...prevStatus,
      [itemId]: isPresent,
    }));
  };

  // Modificar a função handleSubmit para exigir uma data de próximo acerto e gerar PDF
  function handleSubmit() {
    if (!form.getValues().settlement_date) {
      toast.error("Selecione a data do acerto");
      return;
    }
    
    if (!form.getValues().next_settlement_date) {
      toast.error("É necessário definir uma data para o próximo acerto");
      return;
    }
    
    setIsSubmitting(true);
    
    // Obter apenas os IDs dos itens marcados como presentes
    const presentItems = scannedItems
      .filter(item => scannedItemsStatus[item.id])
      .map(item => item.id);
    
    // Verificar se há itens vendidos (não marcados como presentes)
    const hasItemsToReport = suitcaseItems.length > 0 && 
      suitcaseItems.length !== presentItems.length;
    
    if (!hasItemsToReport) {
      setIsSubmitting(false);
      toast.error("Não há itens vendidos para realizar o acerto");
      return;
    }
    
    // Preparar os dados do acerto
    const formData: SuitcaseSettlementFormData = {
      suitcase_id: suitcaseId,
      seller_id: suitcase?.seller_id || '',
      settlement_date: form.getValues().settlement_date,
      next_settlement_date: form.getValues().next_settlement_date,
      items_present: presentItems,
      items_sold: [],
      customer_name: form.getValues().customer_name || '',
      payment_method: form.getValues().payment_method || ''
    };
    
    console.log("Enviando dados de acerto:", formData);
    
    AcertoMaletaController.createAcerto(formData)
      .then((acertoId) => {
        toast.success("Acerto concluído com sucesso");
        
        // Gerar o PDF após a criação do acerto
        AcertoMaletaController.generateReceiptPDF(acertoId)
          .then(receiptUrl => {
            console.log("PDF gerado com sucesso:", receiptUrl);
          })
          .catch(error => {
            console.error("Erro ao gerar PDF:", error);
            toast.error("Erro ao gerar o recibo PDF");
          });
        
        if (onOpenChange) onOpenChange(false);
        if (onAcertoCompleted) onAcertoCompleted();
      })
      .catch((error) => {
        console.error("Erro ao finalizar acerto:", error);
        toast.error(error.message || "Erro ao finalizar acerto");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Realizar Acerto</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Acerto de Maleta</DialogTitle>
          <DialogDescription>
            Informe os dados do acerto para finalizar o processo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="settlement_date"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-base font-semibold">Data do acerto</FormLabel>
                  <FormDescription>
                    Selecione o dia em que o acerto está sendo realizado.
                  </FormDescription>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={(date) => field.onChange(date)}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_settlement_date"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-base font-semibold">Data do próximo acerto</FormLabel>
                  <FormDescription>
                    Defina quando será feito o próximo acerto desta maleta.
                  </FormDescription>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={(date) => field.onChange(date)}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Método de pagamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mb-4">
            <FormLabel className="text-base font-semibold">Itens na Maleta</FormLabel>
            <FormDescription>
              Confirme os itens presentes na maleta.
            </FormDescription>

            <div className="flex items-center space-x-2 mt-2">
              <Input
                placeholder="Escanear código de barras"
                disabled={isScanning}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget as HTMLInputElement;
                    handleScanItem(input.value);
                    input.value = ''; // Limpar o input após escanear
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Simular leitura do código de barras
                  const itemId = prompt("Digite o ID do item para simular a leitura do código de barras:");
                  if (itemId) {
                    handleScanItem(itemId);
                  }
                }}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Simular Scan"
                )}
              </Button>
            </div>

            {scanError && (
              <p className="text-red-500 text-sm mt-1">{scanError}</p>
            )}

            <div className="border rounded-md mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Presente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="p-4">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={scannedItemsStatus[item.id] === true}
                          onCheckedChange={(checked) => handleItemStatusChange(item.id, checked === true)}
                        />
                      </TableCell>
                      <TableCell>
                        <Label htmlFor={`item-${item.id}`}>{item.product?.name}</Label>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product?.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Form>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                Finalizando...
                <Loader className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Finalizar Acerto"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
