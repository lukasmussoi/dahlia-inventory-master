
/**
 * Seção para Exclusão de Maleta Específica
 * @file Este componente renderiza uma seção para exclusão de uma maleta específica por código
 * @depends components/suitcases/DeleteSpecificSuitcase - Componente para executar a exclusão
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteSpecificSuitcase } from "./DeleteSpecificSuitcase";
import { AlertCircle } from "lucide-react";

interface DeleteSpecificSuitcaseSectionProps {
  onSuccess?: () => void;
}

export function DeleteSpecificSuitcaseSection({ onSuccess }: DeleteSpecificSuitcaseSectionProps) {
  // Código da maleta que queremos excluir
  const targetSuitcaseCode = "ML002";

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-red-700 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Exclusão de Maleta Específica
        </CardTitle>
        <CardDescription>
          Esta operação excluirá permanentemente a maleta e todas as suas dependências.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-md border border-red-200">
            <p className="text-sm font-medium mb-2">Detalhes da exclusão:</p>
            <ul className="list-disc pl-5 text-sm">
              <li>Maleta a ser excluída: <strong>{targetSuitcaseCode}</strong></li>
              <li>Todos os itens associados serão removidos</li>
              <li>Todos os acertos e vendas relacionados serão excluídos</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <DeleteSpecificSuitcase 
              suitcaseCode={targetSuitcaseCode} 
              onSuccess={onSuccess} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
