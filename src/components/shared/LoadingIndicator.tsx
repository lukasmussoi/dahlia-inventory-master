
import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  message?: string;
}

export const LoadingIndicator = ({ message }: LoadingIndicatorProps) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground">
          {message || "Carregando..."}
        </p>
      </div>
    </div>
  );
};
