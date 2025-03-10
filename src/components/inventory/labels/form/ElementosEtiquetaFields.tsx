
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
import type { CampoEtiqueta } from "@/types/etiqueta";

const campoSchema = z.object({
  tipo: z.enum(['nome', 'codigo', 'preco']),
  x: z.number().min(0),
  y: z.number().min(0),
  largura: z.number().min(0),
  altura: z.number().min(0),
  tamanhoFonte: z.number().min(0),
});

type ElementosEtiquetaFieldsProps = {
  form: UseFormReturn<{ campos: CampoEtiqueta[] }>;
};

export function ElementosEtiquetaFields({ form }: ElementosEtiquetaFieldsProps) {
  const elementos = [
    { tipo: 'nome', label: 'Nome do Produto' },
    { tipo: 'codigo', label: 'Código de Barras' },
    { tipo: 'preco', label: 'Preço' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Posicionamento dos Elementos</h3>
      {elementos.map((elemento, index) => (
        <div key={elemento.tipo} className="space-y-4">
          <h4 className="font-medium">{elemento.label}</h4>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name={`campos.${index}.x`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posição X (mm)</FormLabel>
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
              name={`campos.${index}.y`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posição Y (mm)</FormLabel>
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
              name={`campos.${index}.tamanhoFonte`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamanho da Fonte (pt)</FormLabel>
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
        </div>
      ))}
    </div>
  );
}
