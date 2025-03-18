
import { 
  Briefcase, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SuitcaseSummaryProps {
  summary: {
    total: number;
    in_use: number;
    returned: number;
    in_replenishment: number;
  };
}

export function SuitcaseSummary({ summary }: SuitcaseSummaryProps) {
  const summaryCards = [
    {
      title: "Total de Maletas",
      value: summary?.total || 0,
      icon: Briefcase,
      color: "bg-gray-100 text-gray-700",
      valueColor: "text-gray-900"
    },
    {
      title: "Em Uso",
      value: summary?.in_use || 0,
      icon: ArrowRight,
      color: "bg-green-100 text-green-700",
      valueColor: "text-green-600"
    },
    {
      title: "Devolvidas",
      value: summary?.returned || 0,
      icon: RefreshCw,
      color: "bg-blue-100 text-blue-700",
      valueColor: "text-blue-600"
    },
    {
      title: "Aguardando Reposição",
      value: summary?.in_replenishment || 0,
      icon: AlertTriangle,
      color: "bg-orange-100 text-orange-700",
      valueColor: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card, index) => (
        <Card key={index} className="border border-gray-200">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
              <h3 className={`text-4xl font-bold ${card.valueColor}`}>{card.value}</h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
