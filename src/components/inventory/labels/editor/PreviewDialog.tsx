
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download } from "lucide-react";

interface PreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  previewPdfUrl: string | null;
  modelName: string;
  handleDownloadPdf: () => void;
}

export function PreviewDialog({
  isOpen,
  onOpenChange,
  previewPdfUrl,
  modelName,
  handleDownloadPdf
}: PreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pré-visualização da Etiqueta</DialogTitle>
          <DialogDescription>
            Esta é uma prévia de como sua etiqueta ficará quando impressa.
          </DialogDescription>
        </DialogHeader>
        
        {previewPdfUrl && (
          <div className="mt-4 bg-gray-100 rounded-lg overflow-hidden">
            <iframe 
              src={previewPdfUrl} 
              className="w-full h-[70vh] border-0"
            />
          </div>
        )}
        
        <div className="flex justify-end mt-2 space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <Button 
            onClick={handleDownloadPdf}
            disabled={!previewPdfUrl}
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
