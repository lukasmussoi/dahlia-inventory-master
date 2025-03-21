
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
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  formatoPagina: z.string(),
  orientacao: z.string(),
  larguraPagina: z.number().optional(),
  alturaPagina: z.number().optional(),
});

type FormatoEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
};

export function FormatoEtiquetaFields({ form }: FormatoEtiquetaFieldsProps) {
  const formatoPagina = form.watch("formatoPagina");
  const showCustomDimensions = formatoPagina === "Personalizado";
  
  // Garantir que a orientação seja sempre definida
  useEffect(() => {
    if (!form.getValues("orientacao")) {
      // Definir orientação padrão para retrato se não estiver definida
      form.setValue("orientacao", "retrato");
    }
    
    // Se for etiqueta pequena, forçar orientação paisagem
    if (formatoPagina === "etiqueta-pequena") {
      form.setValue("orientacao", "paisagem");
    }
    
    // Se for formato personalizado e não tiver dimensões definidas
    if (formatoPagina === "Personalizado") {
      if (!form.getValues("larguraPagina") || form.getValues("larguraPagina") <= 0) {
        form.setValue("larguraPagina", 210); // Valor padrão A4
      }
      if (!form.getValues("alturaPagina") || form.getValues("alturaPagina") <= 0) {
        form.setValue("alturaPagina", 297); // Valor padrão A4
      }
    }
  }, [formatoPagina, form]);

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
                  <SelectItem value="etiqueta-pequena">Etiqueta 90x10mm</SelectItem>
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
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={formatoPagina === "etiqueta-pequena"}
              >
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
        <>
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
          
          <Alert variant="info" className="bg-blue-50 text-blue-800 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              Lembre-se que em orientação paisagem, a largura é maior que a altura.
              Em orientação retrato, a altura é maior que a largura.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
