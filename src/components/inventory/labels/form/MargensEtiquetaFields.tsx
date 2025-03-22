
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
  margemSuperior: z.number().min(0).max(200),
  margemInferior: z.number().min(0).max(200),
  margemEsquerda: z.number().min(0).max(200),
  margemDireita: z.number().min(0).max(200),
});

type MargensEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function MargensEtiquetaFields({ form }: MargensEtiquetaFieldsProps) {
  // Log dos valores iniciais para depuração
  useEffect(() => {
    const margens = {
      superior: form.getValues("margemSuperior"),
      inferior: form.getValues("margemInferior"),
      esquerda: form.getValues("margemEsquerda"),
      direita: form.getValues("margemDireita"),
    };
    console.log("Valores iniciais de margens:", margens);
  }, [form]);

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Margens da Página (mm)</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="margemSuperior"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Margem Superior</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={e => {
                    const value = e.target.value ? Number(e.target.value) : 0;
                    console.log(`Margem superior alterada para: ${value}`);
                    field.onChange(value);
                  }}
                  onBlur={() => {
                    console.log(`Margem superior confirmada: ${field.value}`);
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
          name="margemInferior"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Margem Inferior</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={e => {
                    const value = e.target.value ? Number(e.target.value) : 0;
                    console.log(`Margem inferior alterada para: ${value}`);
                    field.onChange(value);
                  }}
                  onBlur={() => {
                    console.log(`Margem inferior confirmada: ${field.value}`);
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
          name="margemEsquerda"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Margem Esquerda</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={e => {
                    const value = e.target.value ? Number(e.target.value) : 0;
                    console.log(`Margem esquerda alterada para: ${value}`);
                    field.onChange(value);
                  }}
                  onBlur={() => {
                    console.log(`Margem esquerda confirmada: ${field.value}`);
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
          name="margemDireita"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Margem Direita</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={e => {
                    const value = e.target.value ? Number(e.target.value) : 0;
                    console.log(`Margem direita alterada para: ${value}`);
                    field.onChange(value);
                  }}
                  onBlur={() => {
                    console.log(`Margem direita confirmada: ${field.value}`);
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
