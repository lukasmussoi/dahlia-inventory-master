
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
  espacamentoHorizontal: z.number().min(0),
  espacamentoVertical: z.number().min(0),
});

type EspacamentoEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function EspacamentoEtiquetaFields({ form }: EspacamentoEtiquetaFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="espacamentoHorizontal"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Espaçamento Horizontal (mm)</FormLabel>
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

      <FormField
        control={form.control}
        name="espacamentoVertical"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Espaçamento Vertical (mm)</FormLabel>
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
    </div>
  );
}
