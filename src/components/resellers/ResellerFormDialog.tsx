
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ResellerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reseller?: any;
  onSubmit: (data: any) => Promise<void>;
}

export function ResellerFormDialog({
  open,
  onOpenChange,
  reseller,
  onSubmit,
}: ResellerFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    cpf_cnpj: "",
    phone: "",
    email: "",
    status: "Ativa",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: ""
    }
  });
  
  const [loading, setLoading] = useState(false);

  // Carregar dados do revendedor ao abrir o modal
  useEffect(() => {
    if (reseller) {
      setFormData({
        name: reseller.name || "",
        cpf_cnpj: reseller.cpf_cnpj || "",
        phone: reseller.phone || "",
        email: reseller.email || "",
        status: reseller.status || "Ativa",
        address: {
          street: reseller.address?.street || "",
          number: reseller.address?.number || "",
          complement: reseller.address?.complement || "",
          neighborhood: reseller.address?.neighborhood || "",
          city: reseller.address?.city || "",
          state: reseller.address?.state || "",
          zipCode: reseller.address?.zipCode || ""
        }
      });
    } else {
      // Limpar o formulário ao abrir para um novo revendedor
      setFormData({
        name: "",
        cpf_cnpj: "",
        phone: "",
        email: "",
        status: "Ativa",
        address: {
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: "",
          zipCode: ""
        }
      });
    }
  }, [reseller, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Campo de endereço
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [child]: value
        }
      }));
    } else {
      // Campo normal
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      await onSubmit(formData);
      toast.success(reseller ? "Revendedor atualizado com sucesso" : "Revendedor criado com sucesso");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar revendedor:", error);
      toast.error("Erro ao salvar revendedor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {reseller ? "Editar Revendedora" : "Nova Revendedora"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input 
              id="name" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
            <Input 
              id="cpf_cnpj" 
              name="cpf_cnpj"
              value={formData.cpf_cnpj}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input 
              id="phone" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleSelectChange(value, 'status')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativa">Ativa</SelectItem>
                <SelectItem value="Inativa">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md p-4 space-y-4">
            <div className="font-medium">Endereço</div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address.street">Rua</Label>
                <Input 
                  id="address.street" 
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.number">Número</Label>
                <Input 
                  id="address.number" 
                  name="address.number"
                  value={formData.address.number}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.complement">Complemento</Label>
              <Input 
                id="address.complement" 
                name="address.complement"
                value={formData.address.complement}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address.neighborhood">Bairro</Label>
                <Input 
                  id="address.neighborhood" 
                  name="address.neighborhood"
                  value={formData.address.neighborhood}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.city">Cidade</Label>
                <Input 
                  id="address.city" 
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address.state">Estado</Label>
                <Input 
                  id="address.state" 
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.zipCode">CEP</Label>
                <Input 
                  id="address.zipCode" 
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : reseller ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
