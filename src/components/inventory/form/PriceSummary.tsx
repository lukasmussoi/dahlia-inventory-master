
import { Card } from "@/components/ui/card";

interface PriceSummaryProps {
  totalCost: number;
  finalPrice: number;
  finalProfit: number;
  suggestedPrice?: number;
}

export function PriceSummary({ totalCost, finalPrice, finalProfit, suggestedPrice }: PriceSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="bg-[#1A1F2C] p-6 rounded-lg shadow-lg mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Resumo do Produto</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white/10 border-0">
          <h4 className="text-sm font-medium text-gray-300">Custo Total</h4>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalCost)}</p>
        </Card>
        
        <Card className="p-4 bg-white/10 border-0">
          <h4 className="text-sm font-medium text-gray-300">Preço Final</h4>
          <p className="text-2xl font-bold text-white">{formatCurrency(finalPrice)}</p>
          {suggestedPrice && suggestedPrice !== finalPrice && (
            <p className="text-sm text-gray-400">
              Sugerido: {formatCurrency(suggestedPrice)}
            </p>
          )}
        </Card>
        
        <Card className="p-4 bg-white/10 border-0">
          <h4 className="text-sm font-medium text-gray-300">Lucro Final</h4>
          <p className={`text-3xl font-bold ${finalProfit >= 0 ? 'text-[#F97316]' : 'text-red-500'}`}>
            {formatCurrency(finalProfit)}
          </p>
        </Card>
      </div>
    </div>
  );
}
