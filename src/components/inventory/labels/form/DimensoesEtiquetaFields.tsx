
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
  largura: z.number().min(10, "Largura mínima de 10mm"),
  altura: z.number().min(10, "Altura mínima de 10mm"),
});

type DimensoesEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function DimensoesEtiquetaFields({ form }: DimensoesEtiquetaFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="largura"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Largura (mm)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                {...field} 
                onChange={e => field.onChange(Number(e.target.value))}
                min={10}
                max={210}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="altura"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Altura (mm)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                {...field} 
                onChange={e => field.onChange(Number(e.target.value))}
                min={5}
                max={297}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
