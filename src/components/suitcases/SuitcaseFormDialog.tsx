
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SuitcaseModel } from "@/models/suitcaseModel";
import { toast } from "sonner";
import { Suitcase } from "@/types/suitcase";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { Loader2 } from "lucide-react";

interface SuitcaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  suitcase?: Suitcase | null;
  mode: 'create' | 'edit';
}

export function SuitcaseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  suitcase,
  mode
}: SuitcaseFormDialogProps) {
  const [code, setCode] = useState<string>("");
  const [sellerId, setSellerId] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState<string>("");
  const [status, setStatus] = useState<string>("in_use");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sellers, setSellers] = useState<any[]>([]);

  // Carregar dados iniciais (quando estiver em modo de edição)
  useEffect(() => {
    if (suitcase && mode === 'edit') {
      setCode(suitcase.code || "");
      setSellerId(suitcase.seller_id || "");
      setCity(suitcase.city || "");
      setNeighborhood(suitcase.neighborhood || "");
      setStatus(suitcase.status || "in_use");
    } else if (mode === 'create') {
      // Limpar formulário e gerar novo código
      setCode("");
      setSellerId("");
      setCity("");
      setNeighborhood("");
      setStatus("in_use");
      generateNewCode();
    }
  }, [suitcase, mode, open]);

  // Carregar revendedores
  useEffect(() => {
    if (open) {
      loadResellers();
    }
  }, [open]);

  // Efeito para carregar dados da revendedora selecionada
  useEffect(() => {
    if (sellerId) {
      loadSellerAddress(sellerId);
    }
  }, [sellerId]);

  // Gerar novo código de maleta
  const generateNewCode = async () => {
    try {
      const newCode = await SuitcaseModel.generateSuitcaseCode();
      setCode(newCode);
    } catch (error) {
      console.error("Erro ao gerar código da maleta:", error);
      setCode("ML000");
    }
  };

  // Carregar revendedores
  const loadResellers = async () => {
    setIsLoading(true);
    try {
      const data = await SuitcaseModel.getAllSellers();
      setSellers(data);
    } catch (error) {
      console.error("Erro ao carregar revendedoras:", error);
      toast.error("Erro ao carregar revendedoras");
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar endereço da revendedora selecionada
  const loadSellerAddress = async (sellerId: string) => {
    try {
      const seller = await SuitcaseModel.getSellerById(sellerId);
      
      if (seller) {
        // Processar o endereço (pode vir como string JSON ou objeto)
        let address = seller.address;
        
        if (typeof address === 'string') {
          try {
            address = JSON.parse(address);
          } catch (e) {
            console.error("Erro ao processar endereço JSON:", e);
            address = {};
          }
        }
        
        // Definir cidade e bairro com base no endereço da revendedora
        setCity(address?.city || "");
        setNeighborhood(address?.neighborhood || "");
      }
    } catch (error) {
      console.error("Erro ao carregar dados da revendedora:", error);
    }
  };

  // Lidar com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sellerId) {
      toast.error("Selecione uma revendedora");
      return;
    }

    if (!city || !neighborhood) {
      toast.error("A revendedora selecionada não possui cidade e bairro cadastrados");
      return;
    }

    const formData = {
      code,
      seller_id: sellerId,
      city,
      neighborhood,
      status: status || "in_use"
    };

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? "Nova Maleta" : "Editar Maleta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ML001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller">Revendedora</Label>
              <Select value={sellerId} onValueChange={setSellerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma revendedora" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    sellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {/* Exibir cidade e bairro (somente leitura) */}
              {sellerId && city && neighborhood && (
                <div className="mt-2 text-sm text-pink-500">
                  <p className="flex items-center">
                    <span className="font-medium">Localização:</span>
                    <span className="ml-1">{city} • {neighborhood}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_use">Em Uso</SelectItem>
                  <SelectItem value="returned">Devolvida</SelectItem>
                  <SelectItem value="in_replenishment">Aguardando Reposição</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-pink-500 hover:bg-pink-600">
              {mode === 'create' ? "Criar Maleta" : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
