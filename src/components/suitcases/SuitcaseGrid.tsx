
import { SuitcaseCard } from "./SuitcaseCard";
import { Suitcase } from "@/types/suitcase";

interface SuitcaseGridProps {
  suitcases: Suitcase[];
  isAdmin?: boolean;
  onRefresh?: () => void;
  onOpenAcertoDialog?: (suitcase: Suitcase) => void;
  onOpenSupplyDialog?: (suitcase: Suitcase) => void;
}

export function SuitcaseGrid({ 
  suitcases, 
  isAdmin = false, 
  onRefresh,
  onOpenAcertoDialog,
  onOpenSupplyDialog 
}: SuitcaseGridProps) {
  if (suitcases.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-gray-500">Nenhuma maleta encontrada</h3>
        <p className="text-sm text-gray-400 mt-2">
          Tente ajustar os filtros ou criar uma nova maleta
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {suitcases.map((suitcase) => (
        <SuitcaseCard 
          key={suitcase.id}
          suitcase={suitcase}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
          onOpenAcertoDialog={onOpenAcertoDialog}
          onOpenSupplyDialog={onOpenSupplyDialog}
        />
      ))}
    </div>
  );
}
