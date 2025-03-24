
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Suitcase } from "@/types/suitcase";
import { toast } from "sonner";
import { FileDown } from "lucide-react";

interface SuitcaseAcertoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suitcase: Suitcase | null;
  onRefresh: () => void;
  onClose: () => void;
}

export function SuitcaseAcertoDialog({
  open,
  onOpenChange,
  suitcase,
  onRefresh,
  onClose
}: SuitcaseAcertoDialogProps) {
  
  const handleClose = () => {
    onClose();
    onOpenChange(false);
  };

  if (!suitcase) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Registrar Acerto da Maleta</DialogTitle>
          <DialogDescription>
            Registre o acerto da maleta {suitcase.code}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex justify-center">
            <Button 
              variant="outline"
              className="bg-pink-50 text-pink-700 hover:bg-pink-100"
              onClick={handleClose}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Registrar Acerto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
