
import { Card } from "@/components/ui/card";
import { Users, Package, Briefcase } from "lucide-react";

export function DashboardContent() {
  return (
    <main className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">Visão Geral</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 shadow-lg animate-slideIn hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gold/10 rounded-full">
                <Users className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">28</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg animate-slideIn hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rosegold/10 rounded-full">
                <Package className="h-6 w-6 text-rosegold" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Peças em Estoque</p>
                <p className="text-2xl font-semibold text-gray-900">156</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg animate-slideIn hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-full">
                <Briefcase className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Maletas Ativas</p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
