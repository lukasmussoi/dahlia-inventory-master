
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LabelModel, CustomLabel } from "@/models/labelModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Copy, FileText } from "lucide-react";
import { CustomLabelEditor } from "./CustomLabelEditor";
import { ConfirmDialog } from "./ConfirmDialog";
import { useNavigate } from "react-router-dom";

export function CustomLabelsPage() {
  const navigate = useNavigate();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<CustomLabel | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState<string | null>(null);

  // Consulta para buscar todas as etiquetas customizadas
  const { data: labels, isLoading, refetch } = useQuery({
    queryKey: ['custom-labels'],
    queryFn: () => LabelModel.getAllCustomLabels(),
  });

  // Função para abrir o editor com uma etiqueta existente
  const handleEditLabel = (label: CustomLabel) => {
    setSelectedLabel(label);
    setIsEditorOpen(true);
  };

  // Função para abrir o editor para criar nova etiqueta
  const handleNewLabel = () => {
    setSelectedLabel(null);
    setIsEditorOpen(true);
  };

  // Função para duplicar uma etiqueta
  const handleDuplicateLabel = async (label: CustomLabel) => {
    try {
      // Remove ID e timestamps para criar nova etiqueta
      const { id, criado_em, atualizado_em, ...labelData } = label;
      
      // Modifica descrição para indicar que é uma cópia
      const newLabelData = {
        ...labelData,
        descricao: `Cópia de ${label.descricao}`
      };
      
      await LabelModel.createCustomLabel(newLabelData);
      toast.success("Etiqueta duplicada com sucesso!");
      refetch();
    } catch (error) {
      console.error("Erro ao duplicar etiqueta:", error);
      toast.error("Erro ao duplicar etiqueta");
    }
  };

  // Função para confirmar exclusão
  const handleConfirmDelete = (id: string) => {
    setLabelToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  // Função para excluir etiqueta
  const handleDeleteLabel = async () => {
    if (!labelToDelete) return;
    
    try {
      await LabelModel.deleteCustomLabel(labelToDelete);
      toast.success("Etiqueta excluída com sucesso!");
      setIsConfirmDeleteOpen(false);
      setLabelToDelete(null);
      refetch();
    } catch (error) {
      console.error("Erro ao excluir etiqueta:", error);
      toast.error("Erro ao excluir etiqueta");
    }
  };

  // Função para visualizar a etiqueta
  const handleViewLabel = (id: string) => {
    navigate(`/dashboard/inventory/labels/custom/${id}`);
  };

  // Função para salvar etiqueta (nova ou edição)
  const handleSaveLabel = async (label: Partial<CustomLabel>, isNew: boolean) => {
    try {
      if (isNew) {
        // Criar nova etiqueta
        const defaultValues = {
          orientacao: "portrait",
          formato_pagina: "A4",
          tipo: "produto",
          campos: [], // será convertido para JSON
          margem_direita: 10,
          margem_esquerda: 10,
          margem_inferior: 10,
          margem_superior: 10,
          espacamento_vertical: 2,
          espacamento_horizontal: 2,
          altura: 30,
          largura: 60
        };
        
        const newLabel = {
          ...defaultValues,
          ...label
        } as Omit<CustomLabel, 'id' | 'criado_em' | 'atualizado_em'>;
        
        await LabelModel.createCustomLabel(newLabel);
        toast.success("Etiqueta criada com sucesso!");
      } else if (selectedLabel?.id) {
        // Atualizar etiqueta existente
        await LabelModel.updateCustomLabel(selectedLabel.id, label);
        toast.success("Etiqueta atualizada com sucesso!");
      }
      
      setIsEditorOpen(false);
      refetch();
    } catch (error) {
      console.error("Erro ao salvar etiqueta:", error);
      toast.error("Erro ao salvar etiqueta");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Etiquetas Customizadas</h1>
        <Button 
          onClick={handleNewLabel}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Etiqueta
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : labels && labels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labels.map((label) => (
            <Card key={label.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium">{label.descricao}</h3>
                    <p className="text-sm text-gray-500">
                      {label.tipo} - {label.formato_pagina} - {label.largura}x{label.altura}mm
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewLabel(label.id)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLabel(label)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateLabel(label)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleConfirmDelete(label.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg text-gray-500 mb-4">Nenhuma etiqueta customizada encontrada</p>
            <Button onClick={handleNewLabel}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Nova Etiqueta
            </Button>
          </CardContent>
        </Card>
      )}

      {isEditorOpen && (
        <CustomLabelEditor 
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          label={selectedLabel}
          onSave={handleSaveLabel}
        />
      )}

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteLabel}
        title="Excluir Etiqueta"
        message="Tem certeza que deseja excluir esta etiqueta? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
