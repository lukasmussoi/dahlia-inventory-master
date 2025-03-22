
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Printer
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import { EtiquetaCustomForm } from "./EtiquetaCustomForm";
import type { ModeloEtiqueta } from "@/types/etiqueta";
import { formatCurrency } from "@/lib/utils";
import { useEtiquetaZoom } from "./editor/useEtiquetaZoom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function LabelCreator() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModeloEtiqueta | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const { zoomLevel, handleZoomIn, handleZoomOut, handleResetZoom } = useEtiquetaZoom();

  // Carregar modelos de etiquetas
  const { data: models, isLoading } = useQuery({
    queryKey: ['etiqueta-models'],
    queryFn: () => EtiquetaCustomModel.getAll(),
  });

  // Mutação para exclusão
  const deleteMutation = useMutation({
    mutationFn: (id: string) => EtiquetaCustomModel.delete(id),
    onSuccess: () => {
      toast.success("Modelo de etiqueta excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ['etiqueta-models'] });
      setIsDeleteDialogOpen(false);
      setModelToDelete(null);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir modelo: ${error}`);
    }
  });

  const handleEdit = (model: ModeloEtiqueta) => {
    setSelectedModel(model);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setModelToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (modelToDelete) {
      deleteMutation.mutate(modelToDelete);
    }
  };

  const handleOpenPreview = (model: ModeloEtiqueta) => {
    setSelectedModel(model);
    setIsPreviewDialogOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedModel(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedModel(null);
    queryClient.invalidateQueries({ queryKey: ['etiqueta-models'] });
    toast.success("Modelo de etiqueta salvo com sucesso");
  };

  const filteredModels = models?.filter(model => 
    model.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPreview = (model: ModeloEtiqueta) => {
    if (!model || !model.campos) return null;

    return (
      <div 
        className="border border-dashed border-gray-300 relative bg-white overflow-hidden"
        style={{
          width: model.largura * zoomLevel,
          height: model.altura * zoomLevel,
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
        }}
      >
        {model.campos.map((campo, index) => (
          <div
            key={`${campo.tipo}-${index}`}
            className="absolute"
            style={{
              left: campo.x * zoomLevel,
              top: campo.y * zoomLevel,
              width: campo.largura * zoomLevel,
              height: campo.altura * zoomLevel,
            }}
          >
            <div className="w-full h-full flex items-center justify-center p-1">
              <div 
                className="text-center truncate w-full"
                style={{ fontSize: campo.tamanhoFonte * zoomLevel }}
              >
                {campo.tipo === 'nome' ? 'Pingente Cristal' :
                campo.tipo === 'codigo' ? '123456789' : 
                formatCurrency(99.90)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate("/dashboard/inventory/labels")}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Criador de Etiquetas</h1>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Modelo
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar modelos de etiquetas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredModels?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium">Nenhum modelo encontrado</p>
              <p className="mt-1">Crie um novo modelo de etiqueta para começar.</p>
              <Button
                onClick={() => setIsFormOpen(true)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar modelo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Dimensões (mm)</TableHead>
                  <TableHead>Página</TableHead>
                  <TableHead>Elementos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels?.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.nome}</TableCell>
                    <TableCell>{model.descricao || "-"}</TableCell>
                    <TableCell>{`${model.largura} × ${model.altura}`}</TableCell>
                    <TableCell>
                      {model.formatoPagina} 
                      {model.orientacao === "paisagem" ? " (Paisagem)" : " (Retrato)"}
                    </TableCell>
                    <TableCell>{model.campos?.length || 0} elementos</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPreview(model)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(model)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(model.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedModel ? "Editar Modelo de Etiqueta" : "Criar Novo Modelo de Etiqueta"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <EtiquetaCustomForm
              modelo={selectedModel || undefined}
              onClose={handleCloseForm}
              onSuccess={handleFormSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo de etiqueta</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente este modelo de etiqueta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de pré-visualização */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização da Etiqueta</DialogTitle>
            <DialogDescription>
              {selectedModel?.nome} ({selectedModel?.largura} × {selectedModel?.altura} mm)
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md">
            <div className="flex justify-center mb-4 gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>-</Button>
              <Button variant="outline" size="sm" onClick={handleResetZoom}>100%</Button>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>+</Button>
            </div>
            
            <div className="bg-white p-8 border rounded-md shadow-sm overflow-auto">
              {selectedModel && renderPreview(selectedModel)}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
