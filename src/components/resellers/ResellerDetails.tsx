
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  Tag,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ResellerDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reseller: any;
  onEdit?: () => void;
}

export function ResellerDetails({ open, onOpenChange, reseller, onEdit }: ResellerDetailsProps) {
  if (!reseller) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  // Extrair endereço do revendedor
  const address = reseller.address || {};
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> 
            Detalhes da Revendedora
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">{reseller.name}</h2>
            <p className="text-gray-500">
              {reseller.cpfCnpj || reseller.cpf_cnpj}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
              <span>{reseller.phone || "Telefone não informado"}</span>
            </div>
            
            {reseller.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                <span>{reseller.email}</span>
              </div>
            )}

            {(address.street || address.city) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  {address.street && (
                    <div>
                      {address.street}, {address.number}
                      {address.complement && ` - ${address.complement}`}
                    </div>
                  )}
                  {address.neighborhood && (
                    <div>{address.neighborhood}</div>
                  )}
                  {address.city && (
                    <div>
                      {address.city} - {address.state}
                      {address.zipCode && `, ${address.zipCode}`}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Tag className="h-4 w-4 text-gray-500 mt-0.5" />
              <span>Status: {reseller.status}</span>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
              <span>Cadastrada em: {formatDate(reseller.createdAt || reseller.created_at)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {onEdit && (
            <Button onClick={onEdit} className="gap-1">
              <Edit className="h-4 w-4" /> Editar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
