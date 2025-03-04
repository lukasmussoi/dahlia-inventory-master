
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EtiquetaCustomController } from "@/controllers/etiquetaCustomController";
import { ModeloEtiqueta } from "@/models/etiquetaCustomModel";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import EditorEtiqueta from "./EditorEtiqueta";

export function EtiquetasCustom() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("");
  const [editandoEtiqueta, setEditandoEtiqueta] = useState<ModeloEtiqueta | null>(null);
  const [etiquetaParaExcluir, setEtiquetaParaExcluir] = useState<ModeloEtiqueta | null>(null);
  const [criandoNovaEtiqueta, setCriandoNovaEtiqueta] = useState(false);

  const { data: modelos, isLoading, refetch } = useQuery({
    queryKey: ['etiquetas-custom'],
    queryFn: () => EtiquetaCustomController.listarModelos(),
  });

  const handleEditar = (etiqueta: ModeloEtiqueta) => {
    setEditandoEtiqueta(etiqueta);
  };

  const handleClonar = async (etiqueta: ModeloEtiqueta) => {
    try {
      await EtiquetaCustomController.clonarModelo(etiqueta.id, `Cópia de ${etiqueta.descricao}`);
      refetch();
    } catch (error) {
      console.error("Erro ao clonar etiqueta:", error);
    }
  };

  const handleExcluir = (etiqueta: ModeloEtiqueta) => {
    setEtiquetaParaExcluir(etiqueta);
  };

  const confirmarExclusao = async () => {
    if (etiquetaParaExcluir) {
      try {
        await EtiquetaCustomController.excluirModelo(etiquetaParaExcluir.id);
        setEtiquetaParaExcluir(null);
        refetch();
      } catch (error) {
        console.error("Erro ao excluir etiqueta:", error);
      }
    }
  };

  const filteredModelos = modelos?.filter(modelo => {
    const matchesTerm = modelo.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFiltro ? modelo.tipo === tipoFiltro : true;
    return matchesTerm && matchesTipo;
  });

  const handleEtiquetaSalva = () => {
    setEditandoEtiqueta(null);
    setCriandoNovaEtiqueta(false);
    refetch();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {(editandoEtiqueta || criandoNovaEtiqueta) ? (
        <EditorEtiqueta 
          modelo={editandoEtiqueta} 
          onSalvar={handleEtiquetaSalva} 
          onCancelar={() => {
            setEditandoEtiqueta(null);
            setCriandoNovaEtiqueta(false);
          }}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Etiquetas Customizadas</h1>
            <Button onClick={() => setCriandoNovaEtiqueta(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Etiqueta
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tipos</SelectItem>
                      <SelectItem value="produto">Produto</SelectItem>
                      <SelectItem value="contato">Contato</SelectItem>
                      <SelectItem value="notaFiscal">Nota Fiscal</SelectItem>
                      <SelectItem value="ordemServico">Ordem de Serviço</SelectItem>
                      <SelectItem value="venda">Pedido de Venda</SelectItem>
                    </SelectContent>
                  </Select>
                  {(searchTerm || tipoFiltro) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchTerm("");
                        setTipoFiltro("");
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

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Dimensões (mm)</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredModelos?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Nenhuma etiqueta encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredModelos?.map((modelo) => (
                      <TableRow key={modelo.id}>
                        <TableCell className="font-medium">{modelo.descricao}</TableCell>
                        <TableCell>
                          {modelo.tipo === 'produto' && 'Produto'}
                          {modelo.tipo === 'contato' && 'Contato'}
                          {modelo.tipo === 'notaFiscal' && 'Nota Fiscal'}
                          {modelo.tipo === 'ordemServico' && 'Ordem de Serviço'}
                          {modelo.tipo === 'venda' && 'Pedido de Venda'}
                        </TableCell>
                        <TableCell>
                          {modelo.largura} x {modelo.altura}
                        </TableCell>
                        <TableCell>
                          {new Date(modelo.criado_em).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditar(modelo)}
                            >
                              Editar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleClonar(modelo)}
                            >
                              Clonar
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleExcluir(modelo)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={!!etiquetaParaExcluir} onOpenChange={(open) => !open && setEtiquetaParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a etiqueta
              <strong> {etiquetaParaExcluir?.descricao}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
