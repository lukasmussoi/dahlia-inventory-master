
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

const formSchema = z.object({
  margemInternaEtiquetaSuperior: z.number().min(0),
  margemInternaEtiquetaInferior: z.number().min(0),
  margemInternaEtiquetaEsquerda: z.number().min(0),
  margemInternaEtiquetaDireita: z.number().min(0),
});

type MargensInternasEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function MargensInternasEtiquetaFields({ form }: MargensInternasEtiquetaFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[
        { name: "margemInternaEtiquetaSuperior", label: "Margem Superior" },
        { name: "margemInternaEtiquetaInferior", label: "Margem Inferior" },
        { name: "margemInternaEtiquetaEsquerda", label: "Margem Esquerda" },
        { name: "margemInternaEtiquetaDireita", label: "Margem Direita" }
      ].map(({ name, label }) => (
        <FormField
          key={name}
          control={form.control}
          name={name as keyof z.infer<typeof formSchema>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label} (mm)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
