
/**
 * Componente de Spinner de Carregamento
 * @file Oferece um indicador visual de carregamento
 * @relacionamento Utilizado em vários componentes para indicar operações assíncronas
 */
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div className={cn("animate-spin rounded-full border-2 border-t-transparent", className)} />
  );
}
