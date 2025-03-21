
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpDown, FileText, Printer, Eye, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AcertoMaletaController } from "@/controllers/acertoMaletaController";
import { Acerto } from "@/types/suitcase";

interface AcertosListProps {
  onViewAcerto: (acerto: Acerto) => void;
  onRefresh: () => void;
}

export function AcertosList({ onViewAcerto, onRefresh }: AcertosListProps) {
  const [filters, setFilters] = useState({
    search: "",
    status: "todos",
  });

  // Carregar lista de acertos
  const { 
    data: acertos = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['acertos'],
    queryFn: () => AcertoMaletaController.getAllAcertos(),
  });

  // Aplicar filtros
  const filteredAcertos = acertos.filter(acerto => {
    // Filtro de busca
    const searchMatch = 
      filters.search === "" || 
      acerto.suitcase?.code?.toLowerCase().includes(filters.search.toLowerCase()) ||
      acerto.seller?.name?.toLowerCase().includes(filters.search.toLowerCase());
    
    // Filtro de status
    const statusMatch = 
      filters.status === "todos" || 
      acerto.status === filters.status;
    
    return searchMatch && statusMatch;
  });

  // Formatar status para exibição
  const formatStatus = (status: string) => {
    switch (status) {
      case 'pendente': return { text: 'Pendente', className: 'bg-yellow-100 text-yellow-800' };
      case 'concluido': return { text: 'Concluído', className: 'bg-green-100 text-green-800' };
      default: return { text: status, className: 'bg-gray-100 text-gray-800' };
    }
  };

  // Formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  // Visualizar PDF do acerto
  const viewReceiptPdf = async (acertoId: string) => {
    try {
      const pdfUrl = await AcertoMaletaController.generateReceiptPDF(acertoId);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error("Erro ao gerar PDF do acerto:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Acertos de Maletas</CardTitle>
        <CardDescription>
          Visualize e gerencie todos os acertos realizados com as revendedoras.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por código da maleta ou revendedora..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({...filters, status: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="md:w-auto"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : filteredAcertos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <h3 className="text-lg font-medium">Nenhum acerto encontrado</h3>
            <p className="mt-1">
              Não existem acertos que correspondam aos filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Maleta</TableHead>
                  <TableHead>Revendedora</TableHead>
                  <TableHead>Data do Acerto</TableHead>
                  <TableHead>Próximo Acerto</TableHead>
                  <TableHead className="text-right">Total Vendas</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAcertos.map((acerto) => {
                  const status = formatStatus(acerto.status);
                  return (
                    <TableRow key={acerto.id}>
                      <TableCell className="font-medium">
                        {acerto.suitcase?.code || '-'}
                      </TableCell>
                      <TableCell>{acerto.seller?.name || '-'}</TableCell>
                      <TableCell>{formatDate(acerto.settlement_date)}</TableCell>
                      <TableCell>{formatDate(acerto.next_settlement_date)}</TableCell>
                      <TableCell className="text-right">
                        {AcertoMaletaController.formatCurrency(acerto.total_sales)}
                      </TableCell>
                      <TableCell className="text-right">
                        {AcertoMaletaController.formatCurrency(acerto.commission_amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={status.className}>
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewAcerto(acerto)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewReceiptPdf(acerto.id)}
                            title="Imprimir recibo"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Total: {filteredAcertos.length} acerto(s)
        </div>
      </CardFooter>
    </Card>
  );
}
