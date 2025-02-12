
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryModel, PlatingType } from "@/models/inventoryModel";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, Trash } from "lucide-react";
import { PlatingTypeForm } from "@/components/plating/PlatingTypeForm";
import { toast } from "sonner";

const PlatingTypes = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PlatingType | null>(null);

  const { data: platingTypes = [], refetch } = useQuery({
    queryKey: ['plating-types'],
    queryFn: () => InventoryModel.getAllPlatingTypes(),
  });

  const handleEdit = (type: PlatingType) => {
    setSelectedType(type);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este tipo de banho?')) {
      return;
    }

    try {
      await InventoryModel.deletePlatingType(id);
      toast.success('Tipo de banho excluído com sucesso!');
      refetch();
    } catch (error) {
      console.error('Erro ao excluir tipo de banho:', error);
      toast.error('Erro ao excluir tipo de banho');
    }
  };

  const handleAddNew = () => {
    setSelectedType(null);
    setIsFormOpen(true);
  };

  return (
    <div className="h-full min-h-screen bg-background">
      <main className="flex-1 space-y-4 p-4 pt-20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tipos de Banho</h1>
            <p className="text-muted-foreground">
              Gerencie os tipos de banho disponíveis para as peças
            </p>
          </div>
          <Button onClick={handleAddNew} className="bg-gold hover:bg-gold/90">
            <Plus className="h-5 w-5 mr-2" />
            Novo Tipo de Banho
          </Button>
        </div>

        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Valor por Grama</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platingTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>R$ {type.gram_value.toFixed(2)}</TableCell>
                  <TableCell>{type.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(type)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(type.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {isFormOpen && (
          <PlatingTypeForm
            platingType={selectedType}
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSuccess={refetch}
          />
        )}
      </main>
    </div>
  );
};

export default PlatingTypes;
