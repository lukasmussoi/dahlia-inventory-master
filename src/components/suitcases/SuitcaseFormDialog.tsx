
// Observe que esse arquivo não foi fornecido, então estou criando uma implementação parcial
// para demonstrar a funcionalidade de criação de acerto pendente

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuitcaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: any;
}

export function SuitcaseFormDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  initialData 
}: SuitcaseFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [sellers, setSellers] = useState<{ value: string; label: string }[]>([]);
  const [formData, setFormData] = useState({
    id: "",
    code: "",
    seller_id: "",
    city: "",
    neighborhood: "",
    next_settlement_date: undefined as Date | undefined
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (open) {
      loadSellers();
      
      if (initialData) {
        setIsEditing(true);
        setFormData({
          id: initialData.id || "",
          code: initialData.code || "",
          seller_id: initialData.seller_id || "",
          city: initialData.city || "",
          neighborhood: initialData.neighborhood || "",
          next_settlement_date: initialData.next_settlement_date ? new Date(initialData.next_settlement_date) : undefined
        });
      } else {
        setIsEditing(false);
        setFormData({
          id: "",
          code: "",
          seller_id: "",
          city: "",
          neighborhood: "",
          next_settlement_date: undefined
        });
      }
    }
  }, [open, initialData]);

  const loadSellers = async () => {
    try {
      const resellers = await SuitcaseController.getResellersForSelect();
      setSellers(resellers);
    } catch (error) {
      console.error("Erro ao carregar revendedoras:", error);
      toast.error("Erro ao carregar revendedoras");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (isEditing) {
        // Se é uma edição e a data do próximo acerto foi alterada
        const originalDate = initialData.next_settlement_date ? new Date(initialData.next_settlement_date) : undefined;
        const newDate = formData.next_settlement_date;
        
        const dateChanged = 
          (originalDate && !newDate) || 
          (!originalDate && newDate) || 
          (originalDate && newDate && originalDate.toISOString() !== newDate.toISOString());
          
        await SuitcaseController.updateSuitcase(formData.id, formData);
        
        // Se a data do próximo acerto foi alterada, criar um acerto pendente
        if (dateChanged && newDate) {
          await SuitcaseController.createPendingSettlement(formData.id, newDate);
        }
      } else {
        // Criar nova maleta
        const result = await SuitcaseController.createSuitcase(formData);
        
        // Se uma data de próximo acerto foi definida, criar um acerto pendente
        if (formData.next_settlement_date && result.id) {
          await SuitcaseController.createPendingSettlement(result.id, formData.next_settlement_date);
        }
      }
      
      toast.success(`Maleta ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar maleta:", error);
      toast.error(error.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} maleta`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Maleta" : "Nova Maleta"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código da Maleta</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="Ex: M001"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seller">Revendedora</Label>
            <Select 
              value={formData.seller_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, seller_id: value }))}
              required
            >
              <SelectTrigger id="seller">
                <SelectValue placeholder="Selecione uma revendedora" />
              </SelectTrigger>
              <SelectContent>
                {sellers.map((seller) => (
                  <SelectItem key={seller.value} value={seller.value}>
                    {seller.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={formData.city || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Ex: São Paulo"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
              placeholder="Ex: Centro"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="next_settlement_date">Data do Próximo Acerto</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="next_settlement_date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.next_settlement_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.next_settlement_date ? (
                    format(formData.next_settlement_date, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.next_settlement_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, next_settlement_date: date }))}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Esta data será usada para programar o próximo acerto da maleta.
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : (isEditing ? "Atualizar" : "Criar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
