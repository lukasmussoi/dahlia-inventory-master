
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { useEffect } from "react";

const formSchema = z.object({
  espacamentoHorizontal: z.number().min(0).max(200),
  espacamentoVertical: z.number().min(0).max(200),
});

type EspacamentoEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function EspacamentoEtiquetaFields({ form }: EspacamentoEtiquetaFieldsProps) {
  // Log dos valores iniciais para depuração
  useEffect(() => {
    const espacamentoH = form.getValues("espacamentoHorizontal");
    const espacamentoV = form.getValues("espacamentoVertical");
    console.log(`Valores iniciais de espaçamento: horizontal=${espacamentoH}, vertical=${espacamentoV}`);
  }, [form]);

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Espaçamento entre Etiquetas (mm)</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="espacamentoHorizontal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Espaçamento Horizontal</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  value={field.value === undefined ? '' : field.value}
                  onChange={e => {
                    // Garantir que o valor seja sempre um número, mesmo se o campo estiver vazio
                    const value = e.target.value === "" ? 0 : Number(e.target.value);
                    console.log(`Espaçamento horizontal alterado para: ${value}`);
                    field.onChange(value);
                  }}
                  onBlur={e => {
                    // Garantir que o valor seja sempre um número válido ao perder o foco
                    const value = field.value === undefined || isNaN(field.value) ? 0 : field.value;
                    console.log(`Espaçamento horizontal confirmado: ${value}`);
                    form.setValue("espacamentoHorizontal", value);
                  }}
                  min={0}
                  max={200}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="espacamentoVertical"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Espaçamento Vertical</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  value={field.value === undefined ? '' : field.value}
                  onChange={e => {
                    // Garantir que o valor seja sempre um número, mesmo se o campo estiver vazio
                    const value = e.target.value === "" ? 0 : Number(e.target.value);
                    console.log(`Espaçamento vertical alterado para: ${value}`);
                    field.onChange(value);
                  }}
                  onBlur={e => {
                    // Garantir que o valor seja sempre um número válido ao perder o foco
                    const value = field.value === undefined || isNaN(field.value) ? 0 : field.value;
                    console.log(`Espaçamento vertical confirmado: ${value}`);
                    form.setValue("espacamentoVertical", value);
                  }}
                  min={0}
                  max={200}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
