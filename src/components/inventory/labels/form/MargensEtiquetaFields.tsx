
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
  margemSuperior: z.number().min(0),
  margemInferior: z.number().min(0),
  margemEsquerda: z.number().min(0),
  margemDireita: z.number().min(0),
});

type MargensEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function MargensEtiquetaFields({ form }: MargensEtiquetaFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {["margemSuperior", "margemInferior", "margemEsquerda", "margemDireita"].map((margin) => (
        <FormField
          key={margin}
          control={form.control}
          name={margin as keyof z.infer<typeof formSchema>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {margin === "margemSuperior" ? "Margem Superior" :
                 margin === "margemInferior" ? "Margem Inferior" :
                 margin === "margemEsquerda" ? "Margem Esquerda" :
                 "Margem Direita"} (mm)
              </FormLabel>
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
