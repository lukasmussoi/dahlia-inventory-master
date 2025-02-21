
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryModel } from "@/models/inventoryModel";
import { LabelModel } from "@/models/labelModel";
import { Printer, Tag, Search, XCircle, CheckCircle, History, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { generatePPLACommands, sendToPrinter } from "@/utils/printerUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InventoryLabels() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOption, setFilterOption] = useState<"all" | "printed" | "not_printed">("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<string | null>(null);

  // Buscar itens do inventário
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => InventoryModel.getAllItems(),
  });

  // Buscar histórico de etiquetas
  const { data: labelHistory } = useQuery({
    queryKey: ['label-history'],
    queryFn: () => LabelModel.getAllLabelHistory(),
  });

  // Buscar usuários para exibir nomes no histórico
  const { data: profiles } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: () => LabelModel.getAllProfiles(),
  });

  const handlePrintLabels = async (itemIds: string[]) => {
    setIsPrinting(true);
    try {
      for (const itemId of itemIds) {
        const item = items?.find(i => i.id === itemId);
        if (!item) continue;

        // Gera os comandos PPLA para o item
        const commands = generatePPLACommands(item);

        // Envia para a impressora
        await sendToPrinter(commands);

        // Registra a impressão no histórico
        await LabelModel.registerLabelPrint(itemId);
      }

      toast.success("Etiquetas impressas com sucesso!");
      setSelectedItems([]); // Limpa a seleção após imprimir
    } catch (error) {
      console.error("Erro ao imprimir etiquetas:", error);
      toast.error("Erro ao imprimir etiquetas. Verifique a conexão com a impressora.");
    } finally {
      setIsPrinting(false);
    }
  };

  const filteredItems = items?.filter(item => {
    // Aplicar filtro de busca
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.barcode?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Aplicar filtro de status de impressão
    if (filterOption === "printed") {
      return labelHistory?.some(history => history.inventory_id === item.id);
    } else if (filterOption === "not_printed") {
      return !labelHistory?.some(history => history.inventory_id === item.id);
    }

    return true;
  });

  const getLabelStatus = (itemId: string) => {
    const lastPrint = labelHistory
      ?.filter(history => history.inventory_id === itemId)
      .sort((a, b) => new Date(b.printed_at).getTime() - new Date(a.printed_at).getTime())[0];

    if (!lastPrint) return { printed: false };

    const userName = profiles?.find(p => p.id === lastPrint.user_id)?.full_name || 'Usuário';
    return {
      printed: true,
      lastPrintDate: new Date(lastPrint.printed_at).toLocaleDateString('pt-BR'),
      userName,
    };
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho e Ações Principais */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Etiquetas de Produtos</h1>
        {selectedItems.length > 0 && (
          <Button
            onClick={() => handlePrintLabels(selectedItems)}
            className="flex items-center gap-2"
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4" />
            {isPrinting 
              ? "Imprimindo..." 
              : `Imprimir Selecionados (${selectedItems.length})`
            }
          </Button>
        )}
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, SKU ou código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterOption === "all" ? "default" : "outline"}
                onClick={() => setFilterOption("all")}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Todas
              </Button>
              <Button
                variant={filterOption === "printed" ? "default" : "outline"}
                onClick={() => setFilterOption("printed")}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Impressas
              </Button>
              <Button
                variant={filterOption === "not_printed" ? "default" : "outline"}
                onClick={() => setFilterOption("not_printed")}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Não Impressas
              </Button>
              {(searchTerm || filterOption !== "all") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterOption("all");
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Itens */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length > 0 && selectedItems.length === filteredItems?.length}
                    onClick={() => {
                      if (selectedItems.length === filteredItems?.length) {
                        setSelectedItems([]);
                      } else {
                        setSelectedItems(filteredItems?.map(item => item.id) || []);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Código de Barras</TableHead>
                <TableHead>Nome da Peça</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status da Etiqueta</TableHead>
                <TableHead>Última Impressão</TableHead>
                <TableHead>Usuário Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingItems ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Nenhum item encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems?.map((item) => {
                  const status = getLabelStatus(item.id);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onClick={() => {
                            if (selectedItems.includes(item.id)) {
                              setSelectedItems(selectedItems.filter(id => id !== item.id));
                            } else {
                              setSelectedItems([...selectedItems, item.id]);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{item.barcode || "-"}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.sku || "-"}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm ${
                          status.printed
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {status.printed ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Já Impressa
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              Não Impressa
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{status.printed ? status.lastPrintDate : "-"}</TableCell>
                      <TableCell>{status.printed ? status.userName : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintLabels([item.id])}
                            disabled={isPrinting}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItemForHistory(item.id);
                              setHistoryDialogOpen(true);
                            }}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Histórico */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Histórico de Impressões</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {labelHistory
              ?.filter(history => history.inventory_id === selectedItemForHistory)
              .sort((a, b) => new Date(b.printed_at).getTime() - new Date(a.printed_at).getTime())
              .map(history => {
                const userName = profiles?.find(p => p.id === history.user_id)?.full_name || 'Usuário';
                return (
                  <div
                    key={history.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{userName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(history.printed_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-sm">
                      Quantidade: {history.quantity}
                    </div>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
