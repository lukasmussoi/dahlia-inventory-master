
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlatingType, InventoryModel } from "@/models/inventory";
import { PlatingTypeForm } from "@/components/plating/PlatingTypeForm";
import { Edit, Trash2 } from "lucide-react";

const PlatingTypes = () => {
  const [open, setOpen] = useState(false);
  const [editPlatingType, setEditPlatingType] = useState<PlatingType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Corrigir a tipagem no useQuery para suportar getAllPlatingTypes
  const { data: platingTypes = [], isLoading, refetch } = useQuery({
    queryKey: ['plating-types'],
    queryFn: () => InventoryModel.getAllPlatingTypes(),
  });

  const filteredPlatingTypes = searchTerm
    ? platingTypes.filter((type) =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : platingTypes;

  const handleEdit = (platingType: PlatingType) => {
    setEditPlatingType(platingType);
    setOpen(true);
  };

  const handleCreate = () => {
    setEditPlatingType(null);
    setOpen(true);
  };

  // Corrigir a chamada ao método com tipagem adequada
  const handleDelete = async (id: string) => {
    try {
      if (window.confirm("Tem certeza que deseja excluir este tipo de banho?")) {
        await InventoryModel.deletePlatingType(id);
        toast.success("Tipo de banho excluído com sucesso");
        refetch();
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao excluir tipo de banho");
      }
    }
  };

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tipos de Banhos</h1>
        <Button onClick={handleCreate} className="bg-gold hover:bg-gold/90">
          Novo Tipo de Banho
        </Button>
      </div>

      <div className="mt-4">
        <Input
          type="search"
          placeholder="Buscar tipo de banho..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ScrollArea className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Valor por Grama</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredPlatingTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhum tipo de banho encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredPlatingTypes.map((platingType) => (
                <TableRow key={platingType.id}>
                  <TableCell className="font-medium">{platingType.id}</TableCell>
                  <TableCell>{platingType.name}</TableCell>
                  <TableCell>R$ {platingType.gram_value}</TableCell>
                  <TableCell>{platingType.description}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(platingType)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(platingType.id)}
                      className="text-red-500 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      <PlatingTypeForm
        platingType={editPlatingType}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

export default PlatingTypes;
