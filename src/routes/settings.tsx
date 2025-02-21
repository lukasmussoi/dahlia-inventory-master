
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="text-lg font-semibold">
            Configurações Gerais
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              Esta página está em desenvolvimento. Em breve você poderá gerenciar todas as configurações do sistema por aqui.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
