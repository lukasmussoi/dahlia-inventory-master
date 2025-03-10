
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DimensoesEtiquetaFields } from "./form/DimensoesEtiquetaFields";
import { FormatoEtiquetaFields } from "./form/FormatoEtiquetaFields";
import { MargensEtiquetaFields } from "./form/MargensEtiquetaFields";
import { EspacamentoEtiquetaFields } from "./form/EspacamentoEtiquetaFields";
import { useEtiquetaCustomForm } from "@/hooks/useEtiquetaCustomForm";
import type { ModeloEtiqueta } from "@/types/etiqueta";

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  const { form, isLoading, onSubmit } = useEtiquetaCustomForm(modelo, onClose, onSuccess);

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <DimensoesEtiquetaFields form={form} />
        <FormatoEtiquetaFields form={form} />
        <MargensEtiquetaFields form={form} />
        <EspacamentoEtiquetaFields form={form} />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : (modelo?.id ? "Atualizar" : "Criar")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
