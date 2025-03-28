
/**
 * Página de Abertura de Maleta
 * @file Exibe os itens e histórico da maleta para administradores em uma página dedicada
 * @relacionamento Acessada quando o admin clica em "Abrir Maleta" no card de maleta
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { SuitcaseItemsTab } from "@/components/suitcases/open/tabs/SuitcaseItemsTab";
import { SuitcaseHistoryTab } from "@/components/suitcases/open/tabs/SuitcaseHistoryTab";
import { useOpenSuitcase } from "@/hooks/suitcase/useOpenSuitcase";
import { Helmet } from "react-helmet";

export default function OpenSuitcasePage() {
  const { id: suitcaseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPageActive, setIsPageActive] = useState(true);

  // Hook principal que gerencia todos os dados e operações da maleta
  const {
    activeTab,
    setActiveTab,
    suitcase,
    promoterInfo,
    suitcaseItems,
    acertosHistorico,
    isLoading,
    handleReturnToInventory,
    handleMarkAsDamaged
  } = useOpenSuitcase(suitcaseId || null, isPageActive);

  // Configurar metadados da página e estado de atividade
  useEffect(() => {
    setIsPageActive(true);
    
    return () => {
      setIsPageActive(false);
    };
  }, [suitcaseId]);

  // Manipulador para voltar à página anterior
  const handleGoBack = () => {
    navigate("/dashboard/suitcases");
  };

  // Função para tratar a mudança de abas com validação de tipo
  const handleTabChange = (value: string) => {
    if (value === 'itens' || value === 'historico') {
      setActiveTab(value as 'itens' | 'historico');
    }
  };

  // Renderização durante carregamento
  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold">Carregando detalhes da maleta...</h1>
          <LoadingIndicator />
        </div>
      </div>
    );
  }

  // Se não encontrar dados da maleta
  if (!suitcase) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold">Maleta não encontrada</h1>
          <p className="text-muted-foreground">Não foi possível encontrar a maleta solicitada.</p>
          <Button onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para lista de maletas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Maleta {suitcase.code} | Dalia Manager</title>
      </Helmet>
      
      <div className="container py-6">
        <div className="flex flex-col space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">
                Maleta {suitcase.code}
              </h1>
            </div>
          </div>
          
          {/* Conteúdo */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="itens">Itens da Maleta</TabsTrigger>
              <TabsTrigger value="historico">Histórico da Maleta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="itens">
              <SuitcaseItemsTab 
                suitcase={suitcase}
                promoterInfo={promoterInfo}
                suitcaseItems={suitcaseItems}
                onReturnToInventory={handleReturnToInventory}
                onMarkAsDamaged={handleMarkAsDamaged}
              />
            </TabsContent>
            
            <TabsContent value="historico">
              <SuitcaseHistoryTab 
                suitcase={suitcase}
                acertosHistorico={acertosHistorico}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
