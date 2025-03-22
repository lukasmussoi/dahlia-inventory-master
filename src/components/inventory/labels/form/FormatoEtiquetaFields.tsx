
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignRight, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

const formSchema = z.object({
  formatoPagina: z.string(),
  orientacao: z.enum(['retrato', 'paisagem']),
  larguraPagina: z.number().optional(),
  alturaPagina: z.number().optional(),
  margemSuperior: z.number(),
  margemInferior: z.number(),
  margemEsquerda: z.number(),
  margemDireita: z.number(),
});

type FormatoEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function FormatoEtiquetaFields({ form }: FormatoEtiquetaFieldsProps) {
  const formatoPagina = form.watch("formatoPagina");
  const orientacao = form.watch("orientacao");
  const showCustomDimensions = formatoPagina === "Personalizado";
  
  // Estado para dimensões da página efetivas após considerar orientação
  const [dimensoesEfetivas, setDimensoesEfetivas] = useState<{largura: number, altura: number}>({
    largura: 0,
    altura: 0
  });

  // Atualizar dimensões efetivas quando formato ou orientação mudarem
  useEffect(() => {
    let largura = 0;
    let altura = 0;
    
    if (formatoPagina === "Personalizado") {
      largura = form.getValues("larguraPagina") || 210;
      altura = form.getValues("alturaPagina") || 297;
    } else {
      switch (formatoPagina) {
        case "A4":
          largura = 210;
          altura = 297;
          break;
        case "Letter":
          largura = 216;
          altura = 279;
          break;
        case "Legal":
          largura = 216;
          altura = 356;
          break;
        default:
          largura = 210;
          altura = 297;
      }
    }
    
    // Considerar orientação
    if (orientacao === "paisagem") {
      setDimensoesEfetivas({
        largura: altura,
        altura: largura
      });
    } else {
      setDimensoesEfetivas({
        largura,
        altura
      });
    }
  }, [formatoPagina, orientacao, form.watch("larguraPagina"), form.watch("alturaPagina")]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="formatoPagina"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Formato da Página</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="orientacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Orientação
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>A orientação afeta as dimensões efetivas da página</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dimensões atuais: {dimensoesEfetivas.largura} x {dimensoesEfetivas.altura} mm
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <ToggleGroup 
                  type="single" 
                  value={field.value}
                  onValueChange={(value) => {
                    if (value === 'retrato' || value === 'paisagem') {
                      field.onChange(value);
                    }
                  }}
                  className="justify-start border rounded-md"
                >
                  <ToggleGroupItem value="retrato" aria-label="Retrato" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    <AlignLeft className="h-4 w-4 mr-2" />
                    Retrato
                  </ToggleGroupItem>
                  <ToggleGroupItem value="paisagem" aria-label="Paisagem" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    <AlignRight className="h-4 w-4 mr-2" />
                    Paisagem
                  </ToggleGroupItem>
                </ToggleGroup>
              </FormControl>
              <FormDescription>
                Dimensões efetivas: {dimensoesEfetivas.largura} x {dimensoesEfetivas.altura} mm
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {showCustomDimensions && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="larguraPagina"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Largura da Página (mm)</FormLabel>
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
            name="alturaPagina"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Altura da Página (mm)</FormLabel>
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
      )}
    </div>
  );
}
