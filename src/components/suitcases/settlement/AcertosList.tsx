
/**
 * Componente de listagem de Acertos
 * @file Este componente mostra a lista de acertos realizados em maletas
 * @relacionamento Utiliza o AcertoMaletaController e depende de vários componentes da UI
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpDown, FileText, Printer, Eye, BookOpen, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AcertoMaletaController } from "@/controllers/acertoMaletaController";
import { Acerto } from "@/types/suitcase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { openPdfInNewTab } from "@/utils/pdfUtils";

interface AcertosListProps {
  onViewAcerto: (acerto: Acerto) => void;
  onRefresh: () => void;
  isAdmin?: boolean;
}

export function AcertosList({ onViewAcerto, onRefresh, isAdmin = false }: AcertosListProps) {
  const [filters, setFilters] = useState({
    search: "",
    status: "todos",
  });
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});
  const [isPrinting, setIsPrinting] = useState<{ [key: string]: boolean }>({});

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
      acerto.promoter?.name?.toLowerCase().includes(filters.search.toLowerCase());
    
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
      setIsPrinting(prev => ({ ...prev, [acertoId]: true }));
      toast.info("Gerando recibo em PDF...");
      
      const pdfUrl = await AcertoMaletaController.generateReceiptPDF(acertoId);
      console.log("PDF gerado, abrindo URL:", pdfUrl);
      openPdfInNewTab(pdfUrl);
    } catch (error) {
      console.error("Erro ao gerar PDF do acerto:", error);
      toast.error("Erro ao gerar PDF do recibo. Tente novamente.");
    } finally {
      setIsPrinting(prev => ({ ...prev, [acertoId]: false }));
    }
  };

  // Excluir acerto
  const handleDeleteAcerto = async (acertoId: string) => {
    try {
      setIsDeleting(prev => ({ ...prev, [acertoId]: true }));
      
      const success = await AcertoMaletaController.deleteAcerto(acertoId);
      
      if (success) {
        toast.success("Acerto excluído com sucesso");
        refetch();
        onRefresh();
      }
    } catch (error: any) {
      console.error("Erro ao excluir acerto:", error);
      toast.error(error.message || "Erro ao excluir acerto");
    } finally {
      setIsDeleting(prev => ({ ...prev, [acertoId]: false }));
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
                  const isDeletingThisAcerto = isDeleting[acerto.id] || false;
                  const isPrintingThisAcerto = isPrinting[acerto.id] || false;
                  
                  return (
                    <TableRow key={acerto.id}>
                      <TableCell className="font-medium">
                        {acerto.suitcase?.code || '-'}
                      </TableCell>
                      <TableCell>{acerto.promoter?.name || '-'}</TableCell>
                      <TableCell>{formatDate(acerto.data_acerto)}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        {AcertoMaletaController.formatCurrency(acerto.total_vendido)}
                      </TableCell>
                      <TableCell className="text-right">
                        {AcertoMaletaController.formatCurrency(acerto.total_comissao)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={status.className}>
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
                            disabled={isPrintingThisAcerto}
                          >
                            {isPrintingThisAcerto ? (
                              <div className="h-4 w-4 border-2 border-t-transparent border-pink-500 rounded-full animate-spin"></div>
                            ) : (
                              <Printer className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  title="Excluir acerto"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este acerto? Esta ação não pode ser desfeita.
                                    {acerto.status === 'concluido' && (
                                      <p className="mt-2 text-amber-600 font-medium">
                                        Os itens marcados como vendidos serão restaurados para a maleta.
                                      </p>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteAcerto(acerto.id);
                                    }}
                                    disabled={isDeletingThisAcerto}
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    {isDeletingThisAcerto ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                      "Excluir"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
