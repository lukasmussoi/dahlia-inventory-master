
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
      color: "bg-sky-100 text-sky-700",
      iconColor: "text-sky-500"
    },
    {
      title: "Em Uso",
      value: summary?.in_use || 0,
      icon: ArrowRight,
      color: "bg-green-100 text-green-700",
      iconColor: "text-green-500"
    },
    {
      title: "Devolvidas",
      value: summary?.returned || 0,
      icon: RefreshCw,
      color: "bg-blue-100 text-blue-700",
      iconColor: "text-blue-500"
    },
    {
      title: "Aguardando Reposição",
      value: summary?.in_replenishment || 0,
      icon: AlertTriangle,
      color: "bg-orange-100 text-orange-700",
      iconColor: "text-orange-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
            </div>
            <div className={`p-3 rounded-full ${card.color}`}>
              <card.icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
