
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, WrenchIcon } from "lucide-react";

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  const { form, isLoading, onSubmit, pageAreaWarning, corrigirDimensoesAutomaticamente } = useEtiquetaCustomForm(modelo, onClose, onSuccess);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="max-h-[65vh] overflow-y-auto pr-2">
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
          
          {pageAreaWarning && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Problema nas dimensões</AlertTitle>
              <AlertDescription className="flex flex-col space-y-2">
                <span>{pageAreaWarning}</span>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-fit flex gap-2 items-center"
                  onClick={corrigirDimensoesAutomaticamente}
                >
                  <WrenchIcon className="h-4 w-4" />
                  Corrigir automaticamente
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <ElementosEtiquetaFields form={form} />
        </div>

        <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background py-2 border-t mt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !!pageAreaWarning}
            className={pageAreaWarning ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isLoading ? "Salvando..." : (modelo?.id ? "Atualizar" : "Criar")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
