
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
    <div className="bg-[#1A1F2C] p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-3">Resumo do Produto</h3>
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 bg-white/10 border-0">
          <h4 className="text-xs font-medium text-gray-300 mb-1">Custo Total</h4>
          <p className="text-lg font-bold text-white truncate" title={formatCurrency(totalCost)}>
            {formatCurrency(totalCost)}
          </p>
        </Card>
        
        <Card className="p-3 bg-white/10 border-0">
          <h4 className="text-xs font-medium text-gray-300 mb-1">Preço Final</h4>
          <p className="text-lg font-bold text-white truncate" title={formatCurrency(finalPrice)}>
            {formatCurrency(finalPrice)}
          </p>
          {suggestedPrice && suggestedPrice !== finalPrice && (
            <p className="text-xs text-gray-400 truncate" title={`Sugerido: ${formatCurrency(suggestedPrice)}`}>
              Sugerido: {formatCurrency(suggestedPrice)}
            </p>
          )}
        </Card>
        
        <Card className="p-3 bg-white/10 border-0">
          <h4 className="text-xs font-medium text-gray-300 mb-1">Lucro Final</h4>
          <p className={`text-lg font-bold truncate ${finalProfit >= 0 ? 'text-[#F97316]' : 'text-red-500'}`}
             title={formatCurrency(finalProfit)}>
            {formatCurrency(finalProfit)}
          </p>
        </Card>
      </div>
    </div>
  );
}
