
/**
 * Componente de Informações da Maleta
 * @file Exibe as informações básicas da maleta como código, status, localização, etc.
 * @relacionamento Utilizado pelo SuitcaseDetailsTabs como conteúdo da aba de informações
 */
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Suitcase } from "@/types/suitcase";
import { formatStatus } from "@/utils/formatUtils";
import { CalendarIcon, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

interface SuitcaseInfoProps {
  suitcase: Suitcase;
  nextSettlementDate: Date | null;
  onUpdateNextSettlementDate: (date: Date | null) => Promise<void>;
  promoterInfo: any;
  loadingPromoterInfo: boolean;
}

export function SuitcaseInfo({
  suitcase,
  nextSettlementDate,
  onUpdateNextSettlementDate,
  promoterInfo,
  loadingPromoterInfo
}: SuitcaseInfoProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const handleDateSelect = async (date: Date | null) => {
    if (date) {
      setUpdating(true);
      await onUpdateNextSettlementDate(date);
      setUpdating(false);
      setPopoverOpen(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Detalhes da Maleta</h3>
            {suitcase.status && (
              <Badge className={`${
                suitcase.status === 'in_use' ? 'bg-green-500' : 
                suitcase.status === 'returned' ? 'bg-blue-500' : 
                suitcase.status === 'lost' ? 'bg-red-500' : 
                'bg-yellow-500'
              }`}>
                {formatStatus(suitcase.status)}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Código da Maleta</p>
              <p className="font-medium">{suitcase.code}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Data de Envio</p>
              <p className="font-medium">
                {suitcase.sent_at 
                  ? format(new Date(suitcase.sent_at), 'PP', { locale: ptBR }) 
                  : "N/A"}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cidade</p>
              <p className="font-medium">{suitcase.city || "Não informada"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Bairro</p>
              <p className="font-medium">{suitcase.neighborhood || "Não informado"}</p>
            </div>
          </div>
          
          <div className="space-y-1 mt-2">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" /> Próximo Acerto
            </p>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {nextSettlementDate 
                  ? format(nextSettlementDate, 'PP', { locale: ptBR }) 
                  : "Não agendado"}
              </p>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8">
                    {updating ? (
                      <Spinner className="h-4 w-4 mr-2" />
                    ) : (
                      <CalendarIcon className="h-4 w-4 mr-2" />
                    )}
                    Alterar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={nextSettlementDate || undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-lg font-medium flex items-center gap-1">
          <User className="h-4 w-4" /> Informações da Revendedora
        </h3>
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{suitcase.seller?.name || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{suitcase.seller?.phone || "N/A"}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Comissão</p>
            <p className="font-medium">
              {suitcase.seller?.commission_rate 
                ? `${(suitcase.seller.commission_rate * 100).toFixed(1)}%` 
                : "Padrão (30%)"}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Promotora Responsável</h3>
        {loadingPromoterInfo ? (
          <div className="flex items-center justify-center p-4">
            <Spinner className="h-6 w-6" />
          </div>
        ) : promoterInfo ? (
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{promoterInfo.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{promoterInfo.phone || "N/A"}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Informações da promotora não disponíveis</p>
        )}
      </div>
    </div>
  );
}
