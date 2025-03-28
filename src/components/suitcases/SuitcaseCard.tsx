
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowUpDown, Clipboard, PlusCircle } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { OpenSuitcaseModal } from "@/components/suitcases/open/OpenSuitcaseModal";
import { SuitcaseSupplyDialog } from "@/components/suitcases/supply/SuitcaseSupplyDialog";
import { SuitcaseSettlementDialog } from "@/components/suitcases/settlement/SuitcaseSettlementDialog";
import { SuitcaseDetailsDialog } from "@/components/suitcases/details/SuitcaseDetailsDialog";
import { formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SuitcaseCardProps {
  suitcase: any;
  isAdmin?: boolean;
  onRefresh: () => void;
}

export const SuitcaseCard = ({ suitcase, isAdmin = false, onRefresh }: SuitcaseCardProps) => {
  // Estados para controlar a abertura das modais
  const [openSuitcaseModal, setOpenSuitcaseModal] = useState(false);
  const [openSupplyDialog, setOpenSupplyDialog] = useState(false);
  const [openSettlementDialog, setOpenSettlementDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  
  // Calcular prazo de acerto
  const timeUntilSettlement = suitcase?.next_settlement_date 
    ? formatDistance(new Date(suitcase.next_settlement_date), new Date(), { 
        addSuffix: true, 
        locale: ptBR 
      }) 
    : 'Não definido';

  return (
    <Card className="w-full bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold text-gray-800">
            {suitcase.code}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setOpenSuitcaseModal(true)}>
                <Clipboard className="mr-2 h-4 w-4" />
                <span>Abrir Maleta</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setOpenSupplyDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Abastecer Maleta</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setOpenSettlementDialog(true)}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span>Fazer Acerto</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setOpenDetailsDialog(true)}>
                <Clipboard className="mr-2 h-4 w-4" />
                <span>Detalhes</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Revendedora:</span>
            <span className="text-sm font-medium">{suitcase.seller_name}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Localização:</span>
            <span className="text-sm font-medium">
              {suitcase.city && suitcase.neighborhood 
                ? `${suitcase.city} - ${suitcase.neighborhood}`
                : 'Não informado'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Próximo acerto:</span>
            <span className="text-sm font-medium">{timeUntilSettlement}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Peças:</span>
            <span className="text-sm font-medium">{suitcase.item_count || 0}</span>
          </div>
        </div>
      </CardContent>
      
      {/* Modais */}
      <OpenSuitcaseModal 
        open={openSuitcaseModal} 
        onOpenChange={setOpenSuitcaseModal}
        suitcaseId={suitcase.id}
      />
      
      <SuitcaseSupplyDialog
        open={openSupplyDialog}
        onOpenChange={setOpenSupplyDialog}
        suitcase={suitcase}
        onRefresh={onRefresh}
      />
      
      <SuitcaseSettlementDialog
        open={openSettlementDialog}
        onOpenChange={setOpenSettlementDialog}
        suitcase={suitcase}
        onRefresh={onRefresh}
      />
      
      <SuitcaseDetailsDialog
        open={openDetailsDialog}
        onOpenChange={setOpenDetailsDialog}
        suitcaseId={suitcase.id}
        onRefresh={onRefresh}
        isAdmin={isAdmin}
      />
    </Card>
  );
};
