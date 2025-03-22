
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Ruler, ArrowLeftRight, ArrowUpDown } from "lucide-react";

const formSchema = z.object({
  largura: z.number().min(0, "Largura deve ser maior que zero").max(300, "Largura máxima permitida: 300mm"),
  altura: z.number().min(0, "Altura deve ser maior que zero").max(300, "Altura máxima permitida: 300mm"),
  formatoPagina: z.string().optional(),
  larguraPagina: z.number().optional(),
  alturaPagina: z.number().optional(),
  margemEsquerda: z.number().optional(),
  margemDireita: z.number().optional(),
  margemSuperior: z.number().optional(),
  margemInferior: z.number().optional(),
  orientacao: z.string().optional(),
});

type DimensoesEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function DimensoesEtiquetaFields({ form }: DimensoesEtiquetaFieldsProps) {
  // Observar as dimensões da página e margens para validação em tempo real
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Verificar apenas quando os valores relevantes mudarem
      if (['largura', 'altura', 'formatoPagina', 'larguraPagina', 'alturaPagina', 
           'margemEsquerda', 'margemDireita', 'margemSuperior', 'margemInferior', 'orientacao'].includes(name as string)) {
        validarDimensoes();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Função para validar se a etiqueta cabe na página
  const validarDimensoes = () => {
    const values = form.getValues();
    const orientacao = values.orientacao || 'retrato';
    
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
    
    // Aplicar orientação (trocar largura/altura se paisagem)
    if (orientacao === 'paisagem' && larguraPagina && alturaPagina) {
      [larguraPagina, alturaPagina] = [alturaPagina, larguraPagina];
    }
    
    // Se não houver largura e altura válidas, não continua
    if (!larguraPagina || !alturaPagina) return;
    
    // Calcular área útil
    const margemEsquerda = values.margemEsquerda || 0;
    const margemDireita = values.margemDireita || 0;
    const margemSuperior = values.margemSuperior || 0;
    const margemInferior = values.margemInferior || 0;
    
    const areaUtilLargura = larguraPagina - margemEsquerda - margemDireita;
    const areaUtilAltura = alturaPagina - margemSuperior - margemInferior;
    
    // Verificar se a etiqueta é maior que a área útil
    if (values.largura > areaUtilLargura) {
      form.setError('largura', {
        type: 'manual',
        message: `A largura (${values.largura}mm) excede a área útil disponível (${areaUtilLargura}mm).`
      });
    } else {
      // Se estiver dentro da área útil, limpar o erro
      form.clearErrors('largura');
    }
    
    if (values.altura > areaUtilAltura) {
      form.setError('altura', {
        type: 'manual',
        message: `A altura (${values.altura}mm) excede a área útil disponível (${areaUtilAltura}mm).`
      });
    } else {
      // Se estiver dentro da área útil, limpar o erro
      form.clearErrors('altura');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Ruler className="h-4 w-4 mr-2" />
          Dimensões da Etiqueta
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 ml-2 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-[200px] text-xs">
                  Dimensões em milímetros da etiqueta a ser impressa. 
                  Certifique-se que cabem nas dimensões úteis da página.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>Defina a largura e altura em milímetros</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="largura"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Largura (mm)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => {
                      const valor = Number(e.target.value);
                      field.onChange(valor);
                      
                      // Validação básica
                      if (valor <= 0) {
                        form.setError('largura', {
                          type: 'manual',
                          message: 'Largura deve ser maior que zero'
                        });
                      } else if (valor > 300) {
                        form.setError('largura', {
                          type: 'manual',
                          message: 'Largura máxima permitida: 300mm'
                        });
                      }
                    }}
                    min={1}
                    max={300}
                    className={form.formState.errors.largura ? "border-red-300 bg-red-50" : ""}
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
                <FormLabel className="flex items-center">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Altura (mm)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => {
                      const valor = Number(e.target.value);
                      field.onChange(valor);
                      
                      // Validação básica
                      if (valor <= 0) {
                        form.setError('altura', {
                          type: 'manual',
                          message: 'Altura deve ser maior que zero'
                        });
                      } else if (valor > 300) {
                        form.setError('altura', {
                          type: 'manual',
                          message: 'Altura máxima permitida: 300mm'
                        });
                      }
                    }}
                    min={1}
                    max={300}
                    className={form.formState.errors.altura ? "border-red-300 bg-red-50" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
