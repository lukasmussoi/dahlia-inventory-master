
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";
import { validarDimensoesEtiqueta } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Ampliando o esquema para incluir margens e espaçamento
const formSchema = z.object({
  largura: z.number().min(1, "Largura mínima de 1mm").max(300, "Largura máxima de 300mm"),
  altura: z.number().min(1, "Altura mínima de 1mm").max(300, "Altura máxima de 300mm"),
  formatoPagina: z.string().optional(),
  orientacao: z.enum(['retrato', 'paisagem']).optional(),
  larguraPagina: z.number().optional(),
  alturaPagina: z.number().optional(),
  margemSuperior: z.number().min(0, "Margem deve ser positiva").max(200, "Margem muito grande").optional(),
  margemInferior: z.number().min(0, "Margem deve ser positiva").max(200, "Margem muito grande").optional(),
  margemEsquerda: z.number().min(0, "Margem deve ser positiva").max(200, "Margem muito grande").optional(),
  margemDireita: z.number().min(0, "Margem deve ser positiva").max(200, "Margem muito grande").optional(),
  espacamentoHorizontal: z.number().min(0, "Espaçamento deve ser positivo").max(200, "Espaçamento muito grande").optional(),
  espacamentoVertical: z.number().min(0, "Espaçamento deve ser positivo").max(200, "Espaçamento muito grande").optional(),
});

type DimensoesEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function DimensoesEtiquetaFields({ form }: DimensoesEtiquetaFieldsProps) {
  const [areaUtil, setAreaUtil] = useState<{largura: number, altura: number} | null>(null);
  const [validacaoEtiqueta, setValidacaoEtiqueta] = useState<{valido: boolean, mensagem?: string} | null>(null);

  // Observar as dimensões e calcular área útil em tempo real
  useEffect(() => {
    const subscription = form.watch((value) => {
      validarDimensoes();
    });
    
    // Validar inicialmente
    validarDimensoes();
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Função para validar se a etiqueta cabe na página
  const validarDimensoes = () => {
    const values = form.getValues();
    
    // Se não houver valores de página definidos, não valida
    if (!values.formatoPagina) return;
    
    let larguraPagina = values.larguraPagina || 0;
    let alturaPagina = values.alturaPagina || 0;
    
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
        default:
          larguraPagina = 210;
          alturaPagina = 297;
      }
    }
    
    // Se não houver largura e altura válidas, não continua
    if (!larguraPagina || !alturaPagina) return;
    
    // Usar a função utilitária para validação, incluindo orientação
    const resultado = validarDimensoesEtiqueta(
      values.largura || 0,
      values.altura || 0,
      {
        largura: larguraPagina,
        altura: alturaPagina,
        margemSuperior: values.margemSuperior || 0,
        margemInferior: values.margemInferior || 0,
        margemEsquerda: values.margemEsquerda || 0,
        margemDireita: values.margemDireita || 0,
        orientacao: values.orientacao || 'retrato'
      }
    );
    
    setValidacaoEtiqueta({
      valido: resultado.valido,
      mensagem: resultado.mensagem
    });
    
    if (resultado.areaUtil) {
      setAreaUtil(resultado.areaUtil);
    }
  };

  return (
    <Card className="border rounded-md shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Dimensões da Etiqueta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Dimensões da etiqueta */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="largura"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  Largura da Etiqueta (mm)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Largura da etiqueta em milímetros</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => {
                      const valor = Number(e.target.value);
                      field.onChange(valor);
                    }}
                    min={1}
                    max={300}
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
                <FormLabel className="flex items-center gap-1">
                  Altura da Etiqueta (mm)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Altura da etiqueta em milímetros</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => {
                      const valor = Number(e.target.value);
                      field.onChange(valor);
                    }}
                    min={1}
                    max={300}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Margens da página */}
        <Separator className="my-4" />
        <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
          Margens da Página
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Margens entre o conteúdo e as bordas da página</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        {/* Espaçamento entre etiquetas */}
        <Separator className="my-4" />
        <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
          Espaçamento entre Etiquetas
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Espaço entre etiquetas quando várias são impressas em uma página</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
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

        {/* Informações da área útil */}
        {areaUtil && (
          <div className="mt-4 bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">
              <strong>Área útil disponível:</strong> {areaUtil.largura.toFixed(1)} x {areaUtil.altura.toFixed(1)} mm
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Esta é a área disponível na página após aplicar as margens.
            </p>
          </div>
        )}

        {/* Alerta de validação */}
        {validacaoEtiqueta && !validacaoEtiqueta.valido && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Dimensões inválidas</AlertTitle>
            <AlertDescription>
              {validacaoEtiqueta.mensagem}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
