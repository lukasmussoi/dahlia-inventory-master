
import { AlertCircle } from "lucide-react";

interface AccessDeniedProps {
  message?: string;
}

export const AccessDenied = ({ message }: AccessDeniedProps) => {
  return (
    <div className="container mx-auto py-6">
      <div className="bg-destructive/20 p-4 rounded-md">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <h2 className="text-xl font-bold text-destructive">Acesso Negado</h2>
            <p className="text-muted-foreground">
              {message || "Você não tem permissão para acessar esta página. Esta funcionalidade é restrita aos administradores do sistema."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
