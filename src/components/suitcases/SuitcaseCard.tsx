
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Card, 
  CardHeader,
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Suitcase } from "@/types/suitcase";
import { SuitcaseController } from "@/controllers/suitcaseController";
import { 
  Briefcase, 
  User, 
  MapPin, 
  Calendar, 
  Clock,
  Package,
  AlertTriangle
} from "lucide-react";

interface SuitcaseCardProps {
  suitcase: Suitcase;
  onActionClick?: () => void;
}

export function SuitcaseCard({ suitcase, onActionClick }: SuitcaseCardProps) {
  const navigate = useNavigate();
  const [showPromoterInfo, setShowPromoterInfo] = useState(false);
  const [promoterInfo, setPromoterInfo] = useState<any>(null);

  const handleCardClick = () => {
    navigate(`/dashboard/suitcases/${suitcase.id}`);
  };

  const handlePromoterInfoClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (showPromoterInfo) {
      setShowPromoterInfo(false);
      return;
    }
    
    try {
      const promoter = await SuitcaseController.getPromoterForReseller(suitcase.seller_id);
      setPromoterInfo(promoter);
      setShowPromoterInfo(true);
    } catch (error) {
      console.error("Erro ao buscar informações da promotora:", error);
    }
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'in_use':
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-300";
      case 'returned':
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300";
      case 'in_replenishment':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300";
      case 'lost':
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-300";
      case 'in_audit':
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300";
    }
  };

  const formatStatus = (status: string): string => {
    return SuitcaseController.formatStatus(status);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-pink-500" />
            Maleta {suitcase.code}
          </CardTitle>
          <Badge 
            variant="outline"
            className={getBadgeColor(suitcase.status)}
          >
            {formatStatus(suitcase.status)}
          </Badge>
        </div>
        <CardDescription>
          {suitcase.seller && (
            <div className="flex items-center mt-1">
              <User className="h-3 w-3 mr-1" />
              <span className="text-sm">{suitcase.seller.name}</span>
              {suitcase.seller_id && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 ml-1 p-0" 
                  onClick={handlePromoterInfoClick}
                >
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                </Button>
              )}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {suitcase.is_empty && (
          <div className="mb-3 bg-amber-50 p-2 rounded-md flex items-center gap-2 border border-amber-200">
            <Package className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700 font-medium">Maleta vazia após acerto</span>
          </div>
        )}
        
        {showPromoterInfo && promoterInfo && (
          <div className="mb-3 bg-blue-50 p-2 rounded-md border border-blue-200">
            <p className="text-sm font-medium text-blue-700">Promotora: {promoterInfo.name}</p>
            {promoterInfo.phone && (
              <p className="text-xs text-blue-600">Telefone: {promoterInfo.phone}</p>
            )}
          </div>
        )}
        
        <div className="text-sm space-y-1 text-gray-500">
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{suitcase.city}, {suitcase.neighborhood}</span>
          </div>
          {suitcase.next_settlement_date && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Próximo acerto: {format(new Date(suitcase.next_settlement_date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Enviada em: {format(new Date(suitcase.sent_at || suitcase.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {onActionClick && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={(e) => {
              e.stopPropagation();
              onActionClick();
            }}
          >
            Ver Detalhes
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
