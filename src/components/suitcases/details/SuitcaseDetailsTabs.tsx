import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SuitcaseInfo } from "./SuitcaseInfo";
import { SuitcaseItems } from "./SuitcaseItems";
import { SuitcaseHistory } from "./SuitcaseHistory";
import { Briefcase, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suitcase, SuitcaseItem, Acerto } from "@/types/suitcase";

interface SuitcaseDetailsTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  suitcase: Suitcase;
  nextSettlementDate: Date | undefined;
  handleUpdateNextSettlementDate: (date?: Date) => Promise<void>;
  promoterInfo: any | null;
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
  calculateTotalValue: () => number;
  acertosHistorico: Acerto[];
  isLoadingAcertos: boolean;
  handleViewReceipt: (acertoId: string) => void;
  handlePrint: () => void;
  isPrintingPdf: boolean;
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
  calculateTotalValue,
  acertosHistorico,
  isLoadingAcertos,
  handleViewReceipt,
  handlePrint,
  isPrintingPdf
}: SuitcaseDetailsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="border-b">
        <div className="flex items-center px-6">
          <TabsList className="h-10 bg-transparent">
            <TabsTrigger
              value="informacoes"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-pink-500 data-[state=active]:bg-transparent"
            >
              Informações
            </TabsTrigger>
            <TabsTrigger
              value="itens"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-pink-500 data-[state=active]:bg-transparent"
            >
              Itens
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-pink-500 data-[state=active]:bg-transparent"
            >
              Histórico
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handlePrint} 
              className="gap-1"
              disabled={isPrintingPdf}
            >
              {isPrintingPdf ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-pink-500 rounded-full animate-spin mr-1"></div>
              ) : (
                <Printer className="h-4 w-4" />
              )}
              Imprimir
            </Button>
          </div>
        </div>
      </div>
      
      <TabsContent value="informacoes" className="p-6">
        <SuitcaseInfo 
          suitcase={suitcase} 
          nextSettlementDate={nextSettlementDate}
          onUpdateNextSettlementDate={handleUpdateNextSettlementDate}
          promoterInfo={promoterInfo}
          loadingPromoterInfo={loadingPromoterInfo}
        />
      </TabsContent>
      
      <TabsContent value="itens" className="p-6 pt-3">
        <SuitcaseItems 
          suitcaseItems={suitcaseItems}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSearch={handleSearch}
          searchResults={searchResults}
          isSearching={isSearching}
          isAdding={isAdding}
          handleAddItem={handleAddItem}
          handleToggleSold={handleToggleSold}
          handleUpdateSaleInfo={handleUpdateSaleInfo}
          calculateTotalValue={calculateTotalValue}
        />
      </TabsContent>
      
      <TabsContent value="historico" className="p-6">
        <SuitcaseHistory 
          acertosHistorico={acertosHistorico}
          isLoadingAcertos={isLoadingAcertos}
          handleViewReceipt={handleViewReceipt}
        />
      </TabsContent>
    </Tabs>
  );
}
