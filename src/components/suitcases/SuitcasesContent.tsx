
import { useState } from "react";
import { SuitcaseModel } from "@/models/suitcaseModel";
import { useQuery } from "@tanstack/react-query";

interface SuitcasesContentProps {
  isAdmin?: boolean;
  userProfile?: any; // Tipagem temporária, será melhorada posteriormente
}

export function SuitcasesContent({ isAdmin, userProfile }: SuitcasesContentProps) {
  // Buscar maletas usando React Query
  const { data: suitcases, isLoading } = useQuery({
    queryKey: ['suitcases'],
    queryFn: SuitcaseModel.getAllSuitcases,
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <h1 className="text-2xl font-bold mb-6">Maletas</h1>
      {/* Componente completo a ser implementado em breve */}
      <div className="bg-white rounded-lg shadow p-6">
        <p>Funcionalidade em desenvolvimento...</p>
      </div>
    </div>
  );
}
