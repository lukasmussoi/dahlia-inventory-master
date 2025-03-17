import { useState, useEffect } from "react";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface SuitcaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
}

export function SuitcaseFormDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  initialData,
  mode = 'create',
  onSuccess
}: SuitcaseFormDialogProps) {
  const [sellerOptions, setSellerOptions] = useState<{ value: string; label: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSettlementDate, setSelectedSettlementDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState({
    code: "",
    seller_id: "",
    status: "in_use",
    city: "",
    neighborhood: "",
    next_settlement_date: ""
  });

  useEffect(() => {
    async function fetchSellerOptions() {
      try {
        const options = await SuitcaseController.getResellersForSelect();
        setSellerOptions(options);
      } catch (error) {
        console.error("Erro ao buscar revendedoras:", error);
        toast.error("Erro ao carregar lista de revendedoras");
      }
    }

    if (open) {
      fetchSellerOptions();

      if (mode === 'edit' && initialData) {
        const formattedDate = initialData.next_settlement_date
          ? new Date(initialData.next_settlement_date)
          : undefined;

        setFormData({
          code: initialData.code || "",
          seller_id: initialData.seller_id || "",
          status: initialData.status || "in_use",
          city: initialData.city || "",
          neighborhood: initialData.neighborhood || "",
          next_settlement_date: initialData.next_settlement_date || "",
        });

        setSelectedSettlementDate(formattedDate);
      } else {
        setFormData({
          code: "",
          seller_id: "",
          status: "in_use",
          city: "",
          neighborhood: "",
          next_settlement_date: ""
        });
        setSelectedSettlementDate(undefined);
      }
    }
  }, [open, mode, initialData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formDataObj = new FormData(e.currentTarget);
      if (mode === 'edit' && initialData) {
        formDataObj.append('suitcaseId', initialData.id);
      }
      
      await onSubmit(formDataObj);
      onOpenChange(false);
      toast.success(`Maleta ${mode === 'create' ? 'criada' : 'atualizada'} com sucesso`);
      onSuccess?.();
    } catch (error) {
      console.error(`Erro ao ${mode === 'create' ? 'criar' : 'atualizar'} maleta:`, error);
      toast.error(`Erro ao ${mode === 'create' ? 'criar' : 'atualizar'} maleta`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateSelect = (date?: Date) => {
    setSelectedSettlementDate(date);
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      setFormData(prev => ({ ...prev, next_settlement_date: formattedDate }));
    } else {
      setFormData(prev => ({ ...prev, next_settlement_date: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Nova Maleta' : 'Editar Maleta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código da Maleta</Label>
            <Input 
              id="code" 
              name="code"
              placeholder="Ex: ML001" 
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seller_id">Revendedora</Label>
            <Select 
              name="seller_id"
              value={formData.seller_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, seller_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma revendedora" />
              </SelectTrigger>
              <SelectContent>
                {sellerOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              name="status"
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_use">Em Uso</SelectItem>
                <SelectItem value="returned">Devolvida</SelectItem>
                <SelectItem value="in_replenishment">Em Reposição</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input 
              id="city" 
              name="city"
              placeholder="Ex: São Paulo"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input 
              id="neighborhood" 
              name="neighborhood"
              placeholder="Ex: Vila Mariana"
              value={formData.neighborhood}
              onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_settlement_date">Data do Próximo Acerto</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedSettlementDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedSettlementDate ? (
                    format(selectedSettlementDate, "dd/MM/yyyy")
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedSettlementDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <input 
              type="hidden" 
              name="next_settlement_date" 
              value={formData.next_settlement_date} 
            />
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : mode === 'create' ? "Criar Maleta" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
