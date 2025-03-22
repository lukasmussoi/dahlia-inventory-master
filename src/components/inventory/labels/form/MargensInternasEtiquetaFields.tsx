
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

// Define o esquema do formulário para este componente
const formSchema = z.object({
  margemInternaEtiquetaSuperior: z.number().min(0, "Margem deve ser positiva"),
  margemInternaEtiquetaInferior: z.number().min(0, "Margem deve ser positiva"),
  margemInternaEtiquetaEsquerda: z.number().min(0, "Margem deve ser positiva"),
  margemInternaEtiquetaDireita: z.number().min(0, "Margem deve ser positiva"),
});

// Props do componente
type MargensInternasEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

/**
 * Componente para edição das margens internas da etiqueta
 */
export function MargensInternasEtiquetaFields({ form }: MargensInternasEtiquetaFieldsProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium mb-1">Margens Internas da Etiqueta (mm)</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="margemInternaEtiquetaSuperior"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Superior</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
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
          name="margemInternaEtiquetaInferior"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inferior</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
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
          name="margemInternaEtiquetaEsquerda"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Esquerda</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
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
          name="margemInternaEtiquetaDireita"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Direita</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
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
