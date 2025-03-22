
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
  margemSuperior: z.number().min(0).max(200),
  margemInferior: z.number().min(0).max(200),
  margemEsquerda: z.number().min(0).max(200),
  margemDireita: z.number().min(0).max(200),
});

type MargensEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function MargensEtiquetaFields({ form }: MargensEtiquetaFieldsProps) {
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
                  onChange={e => field.onChange(Number(e.target.value))}
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
                  onChange={e => field.onChange(Number(e.target.value))}
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
                  onChange={e => field.onChange(Number(e.target.value))}
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
                  onChange={e => field.onChange(Number(e.target.value))}
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
