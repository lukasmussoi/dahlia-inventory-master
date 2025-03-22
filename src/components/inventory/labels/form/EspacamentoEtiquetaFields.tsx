
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";

const formSchema = z.object({
  espacamentoHorizontal: z.number().min(0).max(200),
  espacamentoVertical: z.number().min(0).max(200),
  margemSuperior: z.number().min(0).max(200),
  margemInferior: z.number().min(0).max(200),
  margemEsquerda: z.number().min(0).max(200),
  margemDireita: z.number().min(0).max(200),
});

type EspacamentoEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function EspacamentoEtiquetaFields({ form }: EspacamentoEtiquetaFieldsProps) {
  const [totalMargensHorizontais, setTotalMargensHorizontais] = useState(0);
  const [totalMargensVerticais, setTotalMargensVerticais] = useState(0);

  // Atualizar cálculo das margens totais
  useEffect(() => {
    const margemEsquerda = form.watch("margemEsquerda") || 0;
    const margemDireita = form.watch("margemDireita") || 0;
    const margemSuperior = form.watch("margemSuperior") || 0;
    const margemInferior = form.watch("margemInferior") || 0;

    setTotalMargensHorizontais(margemEsquerda + margemDireita);
    setTotalMargensVerticais(margemSuperior + margemInferior);
  }, [
    form.watch("margemEsquerda"),
    form.watch("margemDireita"),
    form.watch("margemSuperior"),
    form.watch("margemInferior")
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Margens da Página</h3>
        <FormDescription className="mb-2">
          Define o espaço entre a borda da página e a área de impressão.
        </FormDescription>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="margemSuperior"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Margem Superior (mm)</FormLabel>
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
                <FormLabel>Margem Inferior (mm)</FormLabel>
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
                <FormLabel>Margem Esquerda (mm)</FormLabel>
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
                <FormLabel>Margem Direita (mm)</FormLabel>
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
        <FormDescription className="mt-2 text-xs">
          Margens totais: {totalMargensHorizontais}mm (horizontal) x {totalMargensVerticais}mm (vertical)
        </FormDescription>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Espaçamento Entre Etiquetas</h3>
        <FormDescription className="mb-2">
          Define o espaço entre etiquetas quando várias são impressas na mesma página.
        </FormDescription>
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
                <FormLabel>Espaçamento Vertical (mm)</FormLabel>
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
    </div>
  );
}
