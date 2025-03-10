
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DimensoesEtiquetaFields } from "./form/DimensoesEtiquetaFields";
import { FormatoEtiquetaFields } from "./form/FormatoEtiquetaFields";
import { MargensEtiquetaFields } from "./form/MargensEtiquetaFields";
import { EspacamentoEtiquetaFields } from "./form/EspacamentoEtiquetaFields";
import { ElementosEtiquetaFields } from "./form/ElementosEtiquetaFields";
import { useEtiquetaCustomForm } from "@/hooks/useEtiquetaCustomForm";
import type { ModeloEtiqueta } from "@/types/etiqueta";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  const { form, isLoading, onSubmit } = useEtiquetaCustomForm(modelo, onClose, onSuccess);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do modelo</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DimensoesEtiquetaFields form={form} />
        <FormatoEtiquetaFields form={form} />
        <MargensEtiquetaFields form={form} />
        <EspacamentoEtiquetaFields form={form} />
        <ElementosEtiquetaFields form={form} />

        <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background py-2">
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
