
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
    <div className="bg-[#1A1F2C] p-4 rounded-lg shadow-lg max-w-md">
      <h3 className="text-lg font-semibold text-white mb-4">Resumo do Produto</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg">
          <span className="text-sm font-medium text-gray-300">Custo Total</span>
          <span className="text-base font-bold text-white">
            {formatCurrency(totalCost)}
          </span>
        </div>
        
        <div className="flex flex-col bg-white/10 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Preço Final</span>
            <span className="text-base font-bold text-white">
              {formatCurrency(finalPrice)}
            </span>
          </div>
          {suggestedPrice !== undefined && suggestedPrice !== finalPrice && (
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-400">
                Sugerido: {formatCurrency(suggestedPrice)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg">
          <span className="text-sm font-medium text-gray-300">Lucro Final</span>
          <span className={`text-base font-bold ${finalProfit >= 0 ? 'text-[#F97316]' : 'text-red-500'}`}>
            {formatCurrency(finalProfit)}
          </span>
        </div>
      </div>
    </div>
  );
}
