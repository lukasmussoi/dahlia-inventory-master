
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Edit } from "lucide-react";
import { toast } from "sonner";

interface ResellerDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reseller: any; // Tipagem será melhorada posteriormente
  onEdit?: () => void;
}

export function ResellerDetails({
  open,
  onOpenChange,
  reseller,
  onEdit,
}: ResellerDetailsProps) {
  if (!reseller) return null;

  const formatStatus = (status: string) => {
    return status === "Ativa" ? "Ativa" : "Inativa";
  };

  const statusColor = 
    reseller.status === "Ativa" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";

  // Preservar o comportamento para acessar endereço com segurança
  const address = reseller.address || {};

  const formatAddress = () => {
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.number) parts.push(address.number);
    if (address.neighborhood) parts.push(address.neighborhood);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(`CEP: ${address.zipCode}`);
    
    return parts.join(", ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {reseller.name || "Revendedora"}
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas da revendedora
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge className={statusColor}>
              {formatStatus(reseller.status)}
            </Badge>
          </div>

          {reseller.cpf_cnpj && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">CPF/CNPJ</span>
              <span>{reseller.cpf_cnpj}</span>
            </div>
          )}

          {(reseller.phone || reseller.phone_number) && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{reseller.phone || reseller.phone_number}</span>
            </div>
          )}

          {reseller.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{reseller.email}</span>
            </div>
          )}

          {formatAddress() !== "" && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{formatAddress()}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {onEdit && (
            <Button onClick={onEdit} className="gap-1">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
