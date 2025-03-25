
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Suitcase } from "@/types/suitcase";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, 
  MapPin, 
  MoreVertical, 
  Package, 
  UserCircle, 
  CheckCircle,
  RefreshCcw
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SuitcaseDetailsDialog } from "./SuitcaseDetailsDialog";
import { Button } from "@/components/ui/button";

interface SuitcaseCardProps {
  suitcase: Suitcase;
  isAdmin?: boolean;
  onRefresh?: () => void;
  onOpenAcertoDialog?: (suitcase: Suitcase) => void;
  onOpenSupplyDialog?: (suitcase: Suitcase) => void;
}

export function SuitcaseCard({ 
  suitcase, 
  isAdmin = false,
  onRefresh,
  onOpenAcertoDialog,
  onOpenSupplyDialog 
}: SuitcaseCardProps) {
  const [showSuitcaseDetails, setShowSuitcaseDetails] = useState(false);
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_use':
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case 'returned':
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      case 'in_replenishment':
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case 'lost':
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case 'in_audit':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_use':
        return "Em uso";
      case 'returned':
        return "Devolvida";
      case 'in_replenishment':
        return "Aguardando reposição";
      case 'lost':
        return "Perdida";
      case 'in_audit':
        return "Em auditoria";
      default:
        return "Não definido";
    }
  };

  const timeAgo = suitcase.created_at 
    ? formatDistanceToNow(new Date(suitcase.created_at), { addSuffix: true, locale: ptBR })
    : "Data desconhecida";

  const handleAcerto = () => {
    if (onOpenAcertoDialog) {
      onOpenAcertoDialog(suitcase);
    }
  };

  const handleSupply = () => {
    if (onOpenSupplyDialog) {
      onOpenSupplyDialog(suitcase);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{suitcase.code || `#${suitcase.id.substring(0, 8)}`}</h3>
                <p className="text-sm opacity-90">{timeAgo}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={`${getStatusColor(suitcase.status)} cursor-default`}>
                  {getStatusText(suitcase.status)}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-white">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowSuitcaseDetails(true)}>
                      <Package className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSupply}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Abastecer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAcerto}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Fazer acerto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <UserCircle className="h-4 w-4 mr-2" />
              <span className="truncate max-w-[200px]">
                {suitcase.seller?.name || "Revendedora não especificada"}
              </span>
            </div>

            {(suitcase.city || suitcase.neighborhood) && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="truncate max-w-[200px]">
                  {suitcase.city ? suitcase.city : ""}{suitcase.neighborhood ? `, ${suitcase.neighborhood}` : ""}
                </span>
              </div>
            )}

            {suitcase.next_settlement_date && (
              <div className="flex items-center text-sm text-gray-600">
                <CalendarDays className="h-4 w-4 mr-2" />
                <span>
                  Próximo acerto: {new Date(suitcase.next_settlement_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}

            <div className="flex items-center text-sm text-gray-600">
              <Package className="h-4 w-4 mr-2" />
              <span>
                {suitcase.items_count || 0} itens na maleta
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button variant="outline" size="sm" onClick={() => setShowSuitcaseDetails(true)}>
            Ver detalhes
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSupply}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Abastecer
          </Button>
        </CardFooter>
      </Card>

      {/* Diálogo de detalhes */}
      <SuitcaseDetailsDialog
        open={showSuitcaseDetails}
        onOpenChange={setShowSuitcaseDetails}
        suitcaseId={suitcase.id}
        onRefresh={onRefresh}
      />
    </>
  );
}
