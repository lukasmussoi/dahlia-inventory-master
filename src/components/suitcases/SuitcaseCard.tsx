
/**
 * Componente de Card de Maleta
 * @file Exibe os dados de uma maleta em formato de card com ações
 * @relacionamento Utilizado na listagem de maletas e interage com dialogs de acerto e abastecimento
 */
import { useState } from "react";
import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Store, 
  CalendarClock, 
  MapPin, 
  User, 
  ArrowRightLeft,
  MoreVertical,
  PackageOpen,
  History
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Suitcase } from "@/types/suitcase";
import { SuitcaseSupplyDialog } from "./supply/SuitcaseSupplyDialog";
import { SuitcaseSettlementDialog } from "./settlement/SuitcaseSettlementDialog";
import { OpenSuitcaseDialog } from "./open/OpenSuitcaseDialog";
import { formatStatus } from "@/utils/formatUtils";
import { SuitcaseHistoryDialog } from "./history/SuitcaseHistoryDialog";

interface SuitcaseCardProps {
  suitcase: Suitcase;
  onRefresh?: () => void;
  isAdmin?: boolean;
  onOpenAcertoDialog?: (suitcase: Suitcase) => void;
  onOpenSupplyDialog?: (suitcase: Suitcase) => void;
}

export function SuitcaseCard({ 
  suitcase, 
  onRefresh,
  isAdmin = false,
  onOpenAcertoDialog,
  onOpenSupplyDialog
}: SuitcaseCardProps) {
  const [showSupplyDialog, setShowSupplyDialog] = useState(false);
  const [showSettlementDialog, setShowSettlementDialog] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const hasLateSettlement = suitcase.next_settlement_date && 
    isPast(parseISO(suitcase.next_settlement_date));

  // Determina a variante do badge com base no status da maleta
  const getBadgeVariant = () => {
    switch (suitcase.status) {
      case 'in_use':
        return 'default';
      case 'returned':
        return 'secondary';
      case 'in_replenishment':
        return 'outline';
      case 'lost':
        return 'destructive';
      case 'in_audit':
        return 'outline'; 
      default:
        return 'outline';
    }
  };

  const formatLocation = () => {
    const parts = [];
    if (suitcase.neighborhood) parts.push(suitcase.neighborhood);
    if (suitcase.city) parts.push(suitcase.city);
    return parts.join(', ') || 'Localização não especificada';
  };

  const formatNextSettlementDate = () => {
    if (!suitcase.next_settlement_date) return 'Sem data definida';
    
    const date = parseISO(suitcase.next_settlement_date);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const getItemsCount = () => {
    const count = suitcase.items_count || 0;
    return `${count} ${count === 1 ? 'item' : 'itens'}`;
  };

  // Manipuladores de eventos de abastecimento e acerto
  const handleSupplyClick = () => {
    if (onOpenSupplyDialog) {
      onOpenSupplyDialog(suitcase);
    } else {
      setShowSupplyDialog(true);
    }
  };

  const handleAcertoClick = () => {
    if (onOpenAcertoDialog) {
      onOpenAcertoDialog(suitcase);
    } else {
      setShowSettlementDialog(true);
    }
  };

  // Manipulador para "Abrir Maleta"
  const handleOpenSuitcase = () => {
    setShowOpenDialog(true);
  };

  // Manipulador para "Histórico da Maleta" (nova funcionalidade)
  const handleOpenHistory = () => {
    setShowHistoryDialog(true);
  };

  return (
    <>
      <Card className={hasLateSettlement ? "border-red-300" : ""}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{suitcase.code}</CardTitle>
            <Badge variant={getBadgeVariant()}>{formatStatus(suitcase.status)}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">{suitcase.seller?.name || 'Sem vendedor'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{formatLocation()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarClock className={`h-4 w-4 ${hasLateSettlement ? 'text-red-500' : 'text-gray-500'}`} />
            <span className={`text-sm ${hasLateSettlement ? 'text-red-500 font-medium' : ''}`}>
              Próximo acerto: {formatNextSettlementDate()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{getItemsCount()}</span>
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 flex justify-between border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-blue-600"
            onClick={handleSupplyClick}
          >
            <Store className="h-4 w-4 mr-1" />
            Abastecer
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-purple-600"
            onClick={handleAcertoClick}
          >
            <ArrowRightLeft className="h-4 w-4 mr-1" />
            Acerto
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Mais ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Botão "Abrir Maleta" - Apenas para administradores */}
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={handleOpenSuitcase}>
                    <PackageOpen className="h-4 w-4 mr-2" />
                    Abrir Maleta
                  </DropdownMenuItem>
                  
                  {/* Botão "Histórico" - Nova opção apenas para administradores */}
                  <DropdownMenuItem onClick={handleOpenHistory}>
                    <History className="h-4 w-4 mr-2" />
                    Histórico
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      {/* Diálogo de abastecimento */}
      <SuitcaseSupplyDialog
        open={showSupplyDialog}
        onOpenChange={setShowSupplyDialog}
        suitcase={suitcase}
        onRefresh={onRefresh}
      />

      {/* Diálogo de acerto */}
      <SuitcaseSettlementDialog
        open={showSettlementDialog}
        onOpenChange={setShowSettlementDialog}
        suitcase={suitcase}
        onRefresh={onRefresh}
      />

      {/* Diálogo "Abrir Maleta" */}
      <OpenSuitcaseDialog
        open={showOpenDialog}
        onOpenChange={setShowOpenDialog}
        suitcaseId={suitcase.id}
      />

      {/* Diálogo "Histórico da Maleta" - Novo componente */}
      <SuitcaseHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        suitcaseId={suitcase.id}
        suitcaseCode={suitcase.code || ""}
      />
    </>
  );
}
