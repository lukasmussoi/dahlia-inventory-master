
/**
 * Componente de Abas de Detalhes da Maleta
 * @file Exibe e gerencia as abas informações, itens e histórico da maleta
 * @relacionamento Utilizado pelo SuitcaseDetailsDialog e coordena os componentes de cada aba
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuitcaseInfo } from "./SuitcaseInfo";
import { SuitcaseItems } from "./SuitcaseItems";
import { SuitcaseHistory } from "./SuitcaseHistory";
import { Suitcase, SuitcaseItem } from "@/types/suitcase";
import { Button } from "@/components/ui/button";
import { Trash2, Printer } from "lucide-react";

interface SuitcaseDetailsTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  suitcase: Suitcase;
  nextSettlementDate: Date | null;
  handleUpdateNextSettlementDate: (date: Date | null) => Promise<void>;
  promoterInfo: any;
  loadingPromoterInfo: boolean;
  suitcaseItems: SuitcaseItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: (e?: React.KeyboardEvent) => Promise<void>;
  searchResults: any[];
  isSearching: boolean;
  isAdding: { [key: string]: boolean };
  handleAddItem: (inventoryId: string) => Promise<void>;
  handleToggleSold: (item: SuitcaseItem, sold: boolean) => Promise<void>;
  handleUpdateSaleInfo: (itemId: string, field: string, value: string) => Promise<void>;
  handleReturnToInventory: (itemIds: string[], quantity: number, isDamaged: boolean) => Promise<void>;
  calculateTotalValue: () => number;
  acertosHistorico: any[];
  isLoadingAcertos: boolean;
  handleViewReceipt: (id: string) => void;
  handlePrint: () => Promise<void>;
  isPrintingPdf: boolean;
  isAdmin?: boolean;
  onDeleteClick: () => void;
}

export function SuitcaseDetailsTabs({
  activeTab,
  setActiveTab,
  suitcase,
  nextSettlementDate,
  handleUpdateNextSettlementDate,
  promoterInfo,
  loadingPromoterInfo,
  suitcaseItems,
  searchTerm,
  setSearchTerm,
  handleSearch,
  searchResults,
  isSearching,
  isAdding,
  handleAddItem,
  handleToggleSold,
  handleUpdateSaleInfo,
  handleReturnToInventory,
  calculateTotalValue,
  acertosHistorico,
  isLoadingAcertos,
  handleViewReceipt,
  handlePrint,
  isPrintingPdf,
  isAdmin = false,
  onDeleteClick
}: SuitcaseDetailsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{suitcase.code} - {suitcase.seller?.name}</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            disabled={isPrintingPdf}
          >
            {isPrintingPdf ? (
              <div className="h-4 w-4 border-2 border-t-transparent border-primary rounded-full animate-spin mr-1"></div>
            ) : (
              <Printer className="h-4 w-4 mr-1" />
            )}
            Imprimir
          </Button>
          
          {isAdmin && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={onDeleteClick}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          )}
        </div>
      </div>
      
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="informacoes">Informações</TabsTrigger>
        <TabsTrigger value="itens">Itens</TabsTrigger>
        <TabsTrigger value="historico">Histórico</TabsTrigger>
      </TabsList>
      
      <TabsContent value="informacoes">
        <SuitcaseInfo 
          suitcase={suitcase}
          nextSettlementDate={nextSettlementDate}
          onUpdateNextSettlementDate={handleUpdateNextSettlementDate}
          promoterInfo={promoterInfo}
          loadingPromoterInfo={loadingPromoterInfo}
        />
      </TabsContent>
      
      <TabsContent value="itens">
        <SuitcaseItems 
          suitcaseItems={suitcaseItems}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSearch={handleSearch}
          searchResults={searchResults}
          isSearching={isSearching}
          isAdding={isAdding}
          handleAddItem={handleAddItem}
          handleReturnToInventory={handleReturnToInventory}
          calculateTotalValue={calculateTotalValue}
        />
      </TabsContent>
      
      <TabsContent value="historico">
        <SuitcaseHistory 
          acertosHistorico={acertosHistorico}
          isLoadingAcertos={isLoadingAcertos}
          handleViewReceipt={handleViewReceipt}
        />
      </TabsContent>
    </Tabs>
  );
}
