
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  User, 
  AlertTriangle, 
  Clock, 
  PackageOpen
} from "lucide-react";
import { Suitcase } from "@/types/suitcase";

interface SuitcaseCardProps {
  suitcase: Suitcase;
  onClick: (suitcase: Suitcase) => void;
}

export function SuitcaseCard({ suitcase, onClick }: SuitcaseCardProps) {
  const getStatusBadge = () => {
    let color = "bg-gray-100 text-gray-800";
    let label = "";

    switch (suitcase.status) {
      case "in_use":
        color = "bg-green-100 text-green-800 border-green-200";
        label = "Em Uso";
        break;
      case "returned":
        color = "bg-blue-100 text-blue-800 border-blue-200";
        label = "Devolvida";
        break;
      case "in_replenishment":
        color = "bg-orange-100 text-orange-800 border-orange-200";
        label = "Em Reposição";
        break;
      case "lost":
        color = "bg-red-100 text-red-800 border-red-200";
        label = "Perdida";
        break;
      case "in_audit":
        color = "bg-purple-100 text-purple-800 border-purple-200";
        label = "Em Auditoria";
        break;
      default:
        label = suitcase.status;
    }

    return (
      <Badge variant="outline" className={`${color} border`}>
        {label}
      </Badge>
    );
  };

  const getLocationLabel = () => {
    if (!suitcase.city && !suitcase.neighborhood) return null;
    
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <MapPin className="h-3 w-3" />
        {suitcase.city && suitcase.neighborhood 
          ? `${suitcase.city}, ${suitcase.neighborhood}` 
          : suitcase.city || suitcase.neighborhood}
      </span>
    );
  };

  const needsSettlementWarning = () => {
    if (!suitcase.next_settlement_date) return false;
    
    const today = new Date();
    const settlementDate = new Date(suitcase.next_settlement_date);
    
    const diffTime = settlementDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 3 && diffDays >= 0;
  };

  const isOverdue = () => {
    if (!suitcase.next_settlement_date) return false;
    
    const today = new Date();
    const settlementDate = new Date(suitcase.next_settlement_date);
    
    return today > settlementDate;
  };

  const needsSettlement = needsSettlementWarning();
  const overdue = isOverdue();

  return (
    <Card 
      onClick={() => onClick(suitcase)} 
      className={`transition duration-200 cursor-pointer hover:shadow-md ${
        needsSettlement ? 'border-yellow-300 shadow-yellow-100' : 
        overdue ? 'border-red-300 shadow-red-100' : ''
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base flex items-center gap-1.5 line-clamp-1">
            <Briefcase className="h-4 w-4 text-pink-500 flex-shrink-0" />
            <span className="truncate">{suitcase.code}</span>
          </CardTitle>
          <div className="flex flex-col items-end gap-1">
            {getStatusBadge()}
            
            {suitcase.is_empty && (
              <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 flex items-center gap-1">
                <PackageOpen className="h-3 w-3" />
                Vazia
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-sm font-medium truncate">
              {suitcase.seller?.name || "Revendedora não atribuída"}
            </span>
          </div>
          {getLocationLabel()}
          
          {suitcase.next_settlement_date && (
            <div className="flex items-center gap-1 text-xs">
              <Calendar className={`h-3.5 w-3.5 ${overdue ? 'text-red-500' : needsSettlement ? 'text-yellow-500' : 'text-gray-500'}`} />
              <span className={`${overdue ? 'text-red-600 font-medium' : needsSettlement ? 'text-yellow-600 font-medium' : 'text-gray-500'}`}>
                Acerto: {format(new Date(suitcase.next_settlement_date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          )}
          
          {suitcase.created_at && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              Criada em {format(new Date(suitcase.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          )}
        </div>
      </CardContent>
      {(overdue || needsSettlement) && (
        <div className={`px-4 py-2 text-xs flex items-center gap-1 ${
          overdue ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
        }`}>
          <AlertTriangle className="h-3.5 w-3.5" />
          {overdue 
            ? 'Acerto atrasado!' 
            : `Acerto em ${Math.ceil((new Date(suitcase.next_settlement_date || "").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias`}
        </div>
      )}
      <CardFooter className="pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-pink-600 hover:text-pink-700 hover:bg-pink-50"
        >
          Ver Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
}
