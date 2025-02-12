
import { Card } from "@/components/ui/card";

interface PriceSummaryProps {
  totalCost: number;
  finalPrice: number;
  finalProfit: number;
  suggestedPrice?: number;
}

/**
 * Componente que exibe um resumo visual dos valores principais da peça
 * com destaque para custo, preço e lucro
 */
export function PriceSummary({ totalCost, finalPrice, finalProfit, suggestedPrice }: PriceSummaryProps) {
  // Função para formatar valores monetários em BRL
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card className="p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-500">Custo Total</h4>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
      </Card>
      
      <Card className="p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-500">Preço Final</h4>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(finalPrice)}</p>
        {suggestedPrice && suggestedPrice !== finalPrice && (
          <p className="text-sm text-muted-foreground">
            Sugerido: {formatCurrency(suggestedPrice)}
          </p>
        )}
      </Card>
      
      <Card className="p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-500">Lucro Final</h4>
        <p className={`text-2xl font-bold ${finalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(finalProfit)}
        </p>
      </Card>
    </div>
  );
}
