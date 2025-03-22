
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { MargensEtiquetaFields } from "./MargensEtiquetaFields";
import { EspacamentoEtiquetaFields } from "./EspacamentoEtiquetaFields";

const formSchema = z.object({
  formatoPagina: z.string(),
  orientacao: z.string(),
  margemSuperior: z.number().min(0).max(200),
  margemInferior: z.number().min(0).max(200),
  margemEsquerda: z.number().min(0).max(200),
  margemDireita: z.number().min(0).max(200),
  espacamentoHorizontal: z.number().min(0).max(200),
  espacamentoVertical: z.number().min(0).max(200),
  larguraPagina: z.number().optional(),
  alturaPagina: z.number().optional(),
});

type FormatoEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function FormatoEtiquetaFields({ form }: FormatoEtiquetaFieldsProps) {
  const formatoPagina = form.watch("formatoPagina");
  const showCustomDimensions = formatoPagina === "Personalizado";

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
              <FormLabel>Orientação</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a orientação" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="retrato">Retrato</SelectItem>
                  <SelectItem value="paisagem">Paisagem</SelectItem>
                </SelectContent>
              </Select>
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

      <Separator className="my-4" />
      
      {/* Componente para as margens da página */}
      <MargensEtiquetaFields form={form} />
      
      <Separator className="my-4" />
      
      {/* Componente para o espaçamento entre etiquetas */}
      <EspacamentoEtiquetaFields form={form} />
    </div>
  );
}
