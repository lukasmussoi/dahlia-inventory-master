
import { useParams } from "react-router-dom";
import { ResellerForm } from "@/components/resellers/ResellerForm";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { LoadingIndicator } from "@/components/shared/LoadingIndicator";
import { AccessDenied } from "@/components/shared/AccessDenied";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export default function ResellerFormPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading, isAdmin } = useAuthProtection();

  // Se estiver carregando, mostrar indicador de carregamento
  if (isLoading) {
    return <LoadingIndicator message="Carregando formulário de revendedora..." />;
  }

  // Verificar se o usuário é admin
  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/sales/resellers">Revendedoras</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{id ? "Editar" : "Nova"} Revendedora</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-3xl font-bold mb-1">{id ? "Editar" : "Nova"} Revendedora</h1>
          <p className="text-muted-foreground">
            {id ? "Edite as informações da revendedora" : "Cadastre uma nova revendedora no sistema"}
          </p>
        </div>

        <ResellerForm 
          resellerId={id} 
          onSuccess={() => window.location.href = "/dashboard/sales/resellers"}
        />
      </div>
    </div>
  );
}
