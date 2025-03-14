
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
  largura: z.number().min(10, "Largura mínima de 10mm").max(210, "Largura máxima de 210mm"),
  altura: z.number().min(5, "Altura mínima de 5mm").max(297, "Altura máxima de 297mm"),
  formatoPagina: z.string().optional(),
  larguraPagina: z.number().optional(),
  alturaPagina: z.number().optional(),
  margemEsquerda: z.number().optional(),
  margemDireita: z.number().optional(),
  margemSuperior: z.number().optional(),
  margemInferior: z.number().optional(),
});

type DimensoesEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  ajustarAutomaticamente?: boolean;
};

export function DimensoesEtiquetaFields({ form, ajustarAutomaticamente = false }: DimensoesEtiquetaFieldsProps) {
  // Observar as dimensões da página e margens para validar em tempo real
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Verificar apenas quando os valores relevantes mudarem
      if (['largura', 'altura', 'formatoPagina', 'larguraPagina', 'alturaPagina', 
           'margemEsquerda', 'margemDireita', 'margemSuperior', 'margemInferior'].includes(name as string)) {
        validarDimensoes();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Função para validar se a etiqueta cabe na página
  const validarDimensoes = () => {
    const values = form.getValues();
    
    // Se não houver valores de página definidos, não valida
    if (!values.formatoPagina) return;
    
    let larguraPagina = values.larguraPagina;
    let alturaPagina = values.alturaPagina;
    
    // Para formatos predefinidos
    if (values.formatoPagina !== "Personalizado") {
      switch (values.formatoPagina) {
        case "A4":
          larguraPagina = 210;
          alturaPagina = 297;
          break;
        case "Letter":
          larguraPagina = 216;
          alturaPagina = 279;
          break;
        case "Legal":
          larguraPagina = 216;
          alturaPagina = 356;
          break;
      }
    }
    
    // Se não houver largura e altura válidas, não continua
    if (!larguraPagina || !alturaPagina) return;
    
    // Calcular área útil
    const margemEsquerda = values.margemEsquerda || 10;
    const margemDireita = values.margemDireita || 10;
    const margemSuperior = values.margemSuperior || 10;
    const margemInferior = values.margemInferior || 10;
    
    const areaUtilLargura = larguraPagina - margemEsquerda - margemDireita;
    const areaUtilAltura = alturaPagina - margemSuperior - margemInferior;
    
    // Verificar se a etiqueta é maior que a área útil
    if (values.largura > areaUtilLargura) {
      if (ajustarAutomaticamente) {
        // Ajustar automaticamente a largura
        form.setValue('largura', Math.floor(areaUtilLargura * 0.95));
      } else {
        form.setError('largura', {
          type: 'manual',
          message: `A largura excede a área útil (${areaUtilLargura}mm). Reduza para no máximo ${Math.floor(areaUtilLargura)}mm.`
        });
      }
    }
    
    if (values.altura > areaUtilAltura) {
      if (ajustarAutomaticamente) {
        // Ajustar automaticamente a altura
        form.setValue('altura', Math.floor(areaUtilAltura * 0.95));
      } else {
        form.setError('altura', {
          type: 'manual',
          message: `A altura excede a área útil (${areaUtilAltura}mm). Reduza para no máximo ${Math.floor(areaUtilAltura)}mm.`
        });
      }
    }
  };

  return (
    <div className="space-y-4">
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
                onChange={e => {
                  const valor = Number(e.target.value);
                  field.onChange(valor);
                  
                  // Validação em tempo real
                  if (valor < 10) {
                    form.setError('largura', {
                      type: 'manual',
                      message: 'Largura mínima de 10mm'
                    });
                  } else if (valor > 210) {
                    form.setError('largura', {
                      type: 'manual',
                      message: 'Largura máxima de 210mm'
                    });
                  } else {
                    form.clearErrors('largura');
                  }
                }}
                min={10}
                max={210}
                className={form.formState.errors.largura ? "dimension-invalid" : ""}
              />
            </FormControl>
            <FormMessage />
            {form.formState.errors.largura && (
              <div className="dimension-warning">
                {form.formState.errors.largura.message}
              </div>
            )}
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
                onChange={e => {
                  const valor = Number(e.target.value);
                  field.onChange(valor);
                  
                  // Validação em tempo real
                  if (valor < 5) {
                    form.setError('altura', {
                      type: 'manual',
                      message: 'Altura mínima de 5mm'
                    });
                  } else if (valor > 297) {
                    form.setError('altura', {
                      type: 'manual',
                      message: 'Altura máxima de 297mm'
                    });
                  } else {
                    form.clearErrors('altura');
                  }
                }}
                min={5}
                max={297}
                className={form.formState.errors.altura ? "dimension-invalid" : ""}
              />
            </FormControl>
            <FormMessage />
            {form.formState.errors.altura && (
              <div className="dimension-warning">
                {form.formState.errors.altura.message}
              </div>
            )}
          </FormItem>
        )}
      />
    </div>
  );
}
