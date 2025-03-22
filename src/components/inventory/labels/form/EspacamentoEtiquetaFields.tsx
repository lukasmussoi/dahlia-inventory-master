
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Info, MoveHorizontal, MoveVertical, ArrowUpRightFromCircle } from "lucide-react";

const formSchema = z.object({
  // Margens da página
  margemSuperior: z.number().min(0),
  margemInferior: z.number().min(0),
  margemEsquerda: z.number().min(0), 
  margemDireita: z.number().min(0),
  // Espaçamento entre etiquetas
  espacamentoHorizontal: z.number().min(0),
  espacamentoVertical: z.number().min(0),
  // Margens internas da etiqueta (novo)
  margemInternaEtiquetaSuperior: z.number().min(0).optional(),
  margemInternaEtiquetaInferior: z.number().min(0).optional(),
  margemInternaEtiquetaEsquerda: z.number().min(0).optional(),
  margemInternaEtiquetaDireita: z.number().min(0).optional(),
});

type EspacamentoEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function EspacamentoEtiquetaFields({ form }: EspacamentoEtiquetaFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Margens da página */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            Margens da Página
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Define o espaço entre a borda da página e onde as etiquetas começam a ser impressas.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>Espaço entre as bordas da página e a área de impressão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="margemSuperior"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Superior (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="200"
                      step="0.5"
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
              name="margemInferior"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inferior (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="200"
                      step="0.5"
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
              name="margemEsquerda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Esquerda (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="200"
                      step="0.5"
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
              name="margemDireita"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direita (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="200"
                      step="0.5"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Margens internas da etiqueta */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            Margens Internas da Etiqueta
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Define o espaço entre a borda da etiqueta e o conteúdo (texto, código de barras, etc).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>Espaço entre as bordas da etiqueta e o conteúdo interno</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="margemInternaEtiquetaSuperior"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Superior (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="200"
                      step="0.5"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                      value={field.value || 0}
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
                  <FormLabel>Inferior (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="200"
                      step="0.5"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                      value={field.value || 0}
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
                  <FormLabel>Esquerda (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="200"
                      step="0.5"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                      value={field.value || 0}
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
                  <FormLabel>Direita (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="200"
                      step="0.5"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                      value={field.value || 0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Espaçamento entre etiquetas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            Espaçamento entre Etiquetas
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Define o espaço entre as etiquetas quando múltiplas são impressas.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>Distância entre etiquetas adjacentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="espacamentoHorizontal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <MoveHorizontal className="h-4 w-4 mr-2" />
                    Horizontal (mm)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="200"
                      step="0.5"
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
              name="espacamentoVertical"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <MoveVertical className="h-4 w-4 mr-2" />
                    Vertical (mm)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="200"
                      step="0.5" 
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
