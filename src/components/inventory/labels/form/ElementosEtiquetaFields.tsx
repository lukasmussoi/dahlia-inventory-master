
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
import type { CampoEtiqueta } from "@/types/etiqueta";

type ElementosEtiquetaFieldsProps = {
  form: UseFormReturn<any>;
};

export function ElementosEtiquetaFields({ form }: ElementosEtiquetaFieldsProps) {
  const [camposAtuais, setCamposAtuais] = useState<CampoEtiqueta[]>([]);
  
  // Inicializa os campos com os valores padrão se ainda não existirem
  useEffect(() => {
    const elementosIniciais = [
      { tipo: 'nome' as const, x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7 },
      { tipo: 'codigo' as const, x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8 },
      { tipo: 'preco' as const, x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10 },
    ];
    
    const camposAtuais = form.getValues('campos') || [];
    
    // Se não houver campos ou a quantidade for diferente, inicializa com os valores padrão
    if (!camposAtuais.length || camposAtuais.length !== elementosIniciais.length) {
      form.setValue('campos', elementosIniciais);
      setCamposAtuais(elementosIniciais);
    } else {
      setCamposAtuais(camposAtuais);
    }
  }, [form]);

  const elementos = [
    { tipo: 'nome' as const, label: 'Nome do Produto' },
    { tipo: 'codigo' as const, label: 'Código de Barras' },
    { tipo: 'preco' as const, label: 'Preço' },
  ];

  return (
    <div className="space-y-6 overflow-y-auto max-h-[400px] pr-2">
      <h3 className="text-lg font-medium">Posicionamento dos Elementos</h3>
      {elementos.map((elemento, index) => (
        <div key={elemento.tipo} className="space-y-4 pb-4 border-b">
          <h4 className="font-medium">{elemento.label}</h4>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name={`campos.${index}.tipo`}
              render={({ field }) => (
                <input type="hidden" {...field} value={elemento.tipo} />
              )}
            />
            
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
