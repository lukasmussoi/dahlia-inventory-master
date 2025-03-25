
/**
 * Componente de Card de Maleta
 * @file Exibe os dados de uma maleta em formato de card com ações
 * @relacionamento Utilizado na listagem de maletas e interage com dialogs de detalhes e abastecimento
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
  ArrowRightLeft
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { DotsVertical } from "lucide-react";
import { Suitcase } from "@/types/suitcase";
import { SuitcaseDetailsDialog } from "./SuitcaseDetailsDialog";
import { SuitcaseSupplyDialog } from "./supply/SuitcaseSupplyDialog";
import { SuitcaseSettlementDialog } from "./settlement/SuitcaseSettlementDialog";
import { formatStatus } from "@/utils/formatUtils";

interface SuitcaseCardProps {
  suitcase: Suitcase;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export function SuitcaseCard({ 
  suitcase, 
  onRefresh,
  isAdmin = false
}: SuitcaseCardProps) {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showSupplyDialog, setShowSupplyDialog] = useState(false);
  const [showSettlementDialog, setShowSettlementDialog] = useState(false);

  const hasLateSettlement = suitcase.next_settlement_date && 
    isPast(parseISO(suitcase.next_settlement_date));

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
        return 'warning';
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
            onClick={() => setShowSupplyDialog(true)}
          >
            <Store className="h-4 w-4 mr-1" />
            Abastecer
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-purple-600"
            onClick={() => setShowSettlementDialog(true)}
          >
            <ArrowRightLeft className="h-4 w-4 mr-1" />
            Acerto
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <DotsVertical className="h-4 w-4" />
                <span className="sr-only">Mais ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
                Ver detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      {/* Diálogo de detalhes */}
      <SuitcaseDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        suitcaseId={suitcase.id}
        onRefresh={onRefresh}
        isAdmin={isAdmin}
      />

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
    </>
  );
}
