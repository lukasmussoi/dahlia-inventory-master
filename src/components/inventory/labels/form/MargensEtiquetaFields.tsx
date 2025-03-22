
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
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  margemSuperior: z.number().min(0, "Margem superior deve ser positiva"),
  margemInferior: z.number().min(0, "Margem inferior deve ser positiva"),
  margemEsquerda: z.number().min(0, "Margem esquerda deve ser positiva"),
  margemDireita: z.number().min(0, "Margem direita deve ser positiva"),
  formatoPagina: z.string().optional(),
  orientacao: z.enum(['retrato', 'paisagem']).optional(),
  larguraPagina: z.number().optional(),
  alturaPagina: z.number().optional(),
});

type MargensEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function MargensEtiquetaFields({ form }: MargensEtiquetaFieldsProps) {
  // Estado para armazenar informações sobre a área útil
  const [areaUtil, setAreaUtil] = useState({ largura: 0, altura: 0 });
  const [margensExcessivas, setMargensExcessivas] = useState(false);

  // Recalcular área útil sempre que margens ou dimensões da página mudarem
  useEffect(() => {
    const formatoPagina = form.getValues("formatoPagina") || "A4";
    const orientacao = form.getValues("orientacao") || "retrato";
    
    // Obter dimensões da página
    let larguraPagina: number;
    let alturaPagina: number;
    
    if (formatoPagina === "Personalizado") {
      larguraPagina = form.getValues("larguraPagina") || 210;
      alturaPagina = form.getValues("alturaPagina") || 297;
    } else {
      switch (formatoPagina) {
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
    
    // Ajustar dimensões para orientação
    let larguraEfetiva = larguraPagina;
    let alturaEfetiva = alturaPagina;
    
    if (orientacao === "paisagem") {
      larguraEfetiva = alturaPagina;
      alturaEfetiva = larguraPagina;
    }
    
    // Calcular área útil com base nas margens
    const margemSuperior = form.getValues("margemSuperior") || 0;
    const margemInferior = form.getValues("margemInferior") || 0;
    const margemEsquerda = form.getValues("margemEsquerda") || 0;
    const margemDireita = form.getValues("margemDireita") || 0;
    
    const larguraUtil = larguraEfetiva - margemEsquerda - margemDireita;
    const alturaUtil = alturaEfetiva - margemSuperior - margemInferior;
    
    // Verificar se as margens são excessivas
    const margensExcessivas = larguraUtil <= 0 || alturaUtil <= 0;
    
    setAreaUtil({
      largura: Math.max(0, larguraUtil),
      altura: Math.max(0, alturaUtil)
    });
    
    setMargensExcessivas(margensExcessivas);
    
  }, [
    form.watch("margemSuperior"),
    form.watch("margemInferior"),
    form.watch("margemEsquerda"),
    form.watch("margemDireita"),
    form.watch("formatoPagina"),
    form.watch("orientacao"),
    form.watch("larguraPagina"),
    form.watch("alturaPagina")
  ]);

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          Margens da Página
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Margens definem a área útil disponível para impressão</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Área útil atual: {areaUtil.largura.toFixed(1)} x {areaUtil.altura.toFixed(1)} mm
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h4>
        <p className="text-sm text-muted-foreground">
          Área útil após margens: {areaUtil.largura.toFixed(1)} x {areaUtil.altura.toFixed(1)} mm
        </p>
      </div>
      
      {margensExcessivas && (
        <Alert variant="destructive" className="py-2 mb-4">
          <AlertDescription>
            As margens são muito grandes e não deixam área útil para impressão. Reduza as margens.
          </AlertDescription>
        </Alert>
      )}

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
                  max={100}
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
                  max={100}
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
                  max={100}
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
                  max={100}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormDescription className="italic text-xs mt-2">
        Margens menores aumentam a área útil para impressão, mas podem afetar a compatibilidade com algumas impressoras.
        Recomendamos margens de pelo menos 5mm.
      </FormDescription>
    </div>
  );
}
