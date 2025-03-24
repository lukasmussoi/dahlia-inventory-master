import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit, Plus, X } from "lucide-react";
import { Suitcase } from "@/types/suitcase";
import { suitcaseController } from "@/controllers/suitcaseController";
import { toast } from "sonner";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuitcaseItemList } from "@/components/suitcases/SuitcaseItemList";
import { SuitcaseInventorySearch } from "@/components/suitcases/SuitcaseInventorySearch";
import { AuthController } from "@/controllers/authController";

interface SuitcaseDetailsDialogProps {
  suitcaseId?: string;
}

export function SuitcaseDetailsDialog({ suitcaseId }: SuitcaseDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [nextSettlementDate, setNextSettlementDate] = useState<Date | undefined>(undefined);
  const [showItemSearch, setShowItemSearch] = useState(false);

  const queryClient = useQueryClient();

  // Buscar detalhes da maleta
  const { data: suitcase, isLoading } = useQuery({
    queryKey: ['suitcase', suitcaseId],
    queryFn: () => suitcaseController.getSuitcaseById(suitcaseId || ''),
    enabled: !!suitcaseId,
  });

  useEffect(() => {
    if (suitcase) {
      setCode(suitcase.code);
      setCity(suitcase.city || "");
      setNeighborhood(suitcase.neighborhood || "");
      setNextSettlementDate(suitcase.next_settlement_date ? new Date(suitcase.next_settlement_date) : undefined);
    }
  }, [suitcase]);

  // Mutação para atualizar os dados da maleta
  const updateSuitcaseMutation = useMutation(
    (data: any) => suitcaseController.updateSuitcase(suitcaseId || '', data),
    {
      onSuccess: () => {
        toast.success("Maleta atualizada com sucesso!");
        queryClient.invalidateQueries(['suitcase', suitcaseId]);
        queryClient.invalidateQueries(['suitcases']);
        setIsEditable(false);
      },
      onError: (error: any) => {
        toast.error(error?.message || "Erro ao atualizar a maleta.");
      },
    }
  );

  // Buscar perfil e permissões do usuário
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => AuthController.getUserProfileWithRoles(),
  });

  // Função para lidar com a atualização da maleta
  const handleUpdate = async () => {
    if (!suitcaseId) return;

    const dataToUpdate = {
      code,
      city,
      neighborhood,
      next_settlement_date: nextSettlementDate ? nextSettlementDate.toISOString() : null,
    };

    updateSuitcaseMutation.mutate(dataToUpdate);
  };

  // Função para formatar a data
  const formatDate = (date: Date | undefined) => {
    return date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Nenhuma data definida';
  };

  // Função para abrir a busca de itens
  const handleOpenSearch = () => {
    setShowItemSearch(true);
  };

  // Função para fechar a busca de itens
  const handleCloseSearch = () => {
    setShowItemSearch(false);
  };

  // Função para lidar com a adição de um item
  const handleItemAdded = () => {
    // Invalida a query de itens da maleta para atualizar a lista
    queryClient.invalidateQueries(['suitcase', suitcaseId]);
  };

  // Função para lidar com a alteração dos itens
  const handleItemsChange = () => {
    // Invalida a query de itens da maleta para atualizar a lista
    queryClient.invalidateQueries(['suitcase', suitcaseId]);
  };

  if (isLoading || !suitcase) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled>
            <Edit className="h-4 w-4 mr-2" />
            Detalhes
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
            <DialogDescription>
              Aguarde enquanto os detalhes da maleta são carregados.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Detalhes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Maleta</DialogTitle>
          <DialogDescription>
            Visualize e edite os detalhes da maleta.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Código da Maleta */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Código
            </Label>
            <Input
              id="code"
              value={code}
              disabled={!isEditable}
              onChange={(e) => setCode(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Cidade */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">
              Cidade
            </Label>
            <Input
              id="city"
              value={city}
              disabled={!isEditable}
              onChange={(e) => setCity(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Bairro */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="neighborhood" className="text-right">
              Bairro
            </Label>
            <Input
              id="neighborhood"
              value={neighborhood}
              disabled={!isEditable}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Próximo Acerto */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nextSettlementDate" className="text-right">
              Próximo Acerto
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 flex justify-between text-left font-normal",
                    !nextSettlementDate && "text-muted-foreground"
                  )}
                  disabled={!isEditable}
                >
                  {formatDate(nextSettlementDate)}
                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="right">
                <Calendar
                  mode="single"
                  selected={nextSettlementDate}
                  onSelect={setNextSettlementDate}
                  disabled={!isEditable}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Lista de itens */}
          <div className="py-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Itens na maleta</h3>
            
            {showItemSearch && (
              <SuitcaseInventorySearch 
                suitcaseId={suitcase?.id || ''} 
                onClose={handleCloseSearch}
                onItemAdded={handleItemAdded}
              />
            )}
            
            <SuitcaseItemList 
              suitcaseId={suitcase?.id || ''} 
              onItemsChanged={handleItemsChange}
              readOnly={!isEditable}
              suitcaseStatus={suitcase?.status}
              userRoles={userProfile?.roles || []}
            />
            
            {isEditable && (
              <div className="flex justify-end mt-4">
                <Button 
                  type="button" 
                  onClick={handleOpenSearch}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end">
          {isEditable ? (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsEditable(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={updateSuitcaseMutation.isLoading}>
                {updateSuitcaseMutation.isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditable(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
