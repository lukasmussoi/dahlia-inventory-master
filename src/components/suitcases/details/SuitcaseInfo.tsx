
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Suitcase } from "@/types/suitcase";

interface SuitcaseInfoProps {
  suitcase: Suitcase;
  nextSettlementDate: Date | undefined;
  onUpdateNextSettlementDate: (date?: Date) => Promise<void>;
  promoterInfo: any | null;
  loadingPromoterInfo: boolean;
}

export function SuitcaseInfo({
  suitcase,
  nextSettlementDate,
  onUpdateNextSettlementDate,
  promoterInfo,
  loadingPromoterInfo
}: SuitcaseInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Dados da Maleta</h3>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">Código:</span>
            <p className="font-medium">{suitcase.code}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Status:</span>
            <p className="font-medium">{suitcase.status === 'in_use' ? 'Em Uso' : 
              suitcase.status === 'returned' ? 'Devolvida' : 
              suitcase.status === 'in_replenishment' ? 'Em Reposição' : 
              suitcase.status}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Criada em:</span>
            <p className="font-medium">{new Date(suitcase.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="pt-2">
            <span className="text-sm text-gray-500 block mb-1">Próximo acerto:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !nextSettlementDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nextSettlementDate ? (
                    format(nextSettlementDate, "dd/MM/yyyy")
                  ) : (
                    <span>Definir data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={nextSettlementDate}
                  onSelect={onUpdateNextSettlementDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  disabled={(date) => date < new Date()}
                  locale={ptBR}
                />
                <div className="p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-center text-sm"
                    onClick={() => onUpdateNextSettlementDate(undefined)}
                  >
                    Limpar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Dados da Revendedora</h3>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-500">Nome:</span>
            <p className="font-medium">{suitcase.seller?.name || "Não informado"}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Telefone:</span>
            <p className="font-medium">{suitcase.seller?.phone || "Não informado"}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Localização:</span>
            <p className="font-medium">{suitcase.city || "Não informado"}, {suitcase.neighborhood || "Não informado"}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Promotora responsável:</span>
            <p className="font-medium">
              {loadingPromoterInfo ? (
                <span className="inline-block w-24 h-4 bg-gray-200 animate-pulse rounded"></span>
              ) : (
                promoterInfo?.name || "Não atribuída"
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
