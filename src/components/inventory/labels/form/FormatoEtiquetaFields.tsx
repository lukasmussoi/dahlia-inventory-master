
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
import { useEffect } from "react";

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
  const orientacao = form.watch("orientacao");
  const showCustomDimensions = formatoPagina === "Personalizado";

  // Log dos valores iniciais para depuração
  useEffect(() => {
    console.log(`Valores iniciais de formato: 
      formatoPagina=${formatoPagina}, 
      orientacao=${orientacao}, 
      larguraPagina=${form.getValues("larguraPagina")}, 
      alturaPagina=${form.getValues("alturaPagina")},
      margemSuperior=${form.getValues("margemSuperior")},
      margemInferior=${form.getValues("margemInferior")},
      margemEsquerda=${form.getValues("margemEsquerda")},
      margemDireita=${form.getValues("margemDireita")}`
    );
  }, [formatoPagina, orientacao, form]);

  // Atualiza as dimensões da página ao alterar o formato
  useEffect(() => {
    if (formatoPagina !== "Personalizado") {
      // Atualizar dimensões da página conforme o formato selecionado
      let largura = 210; // Padrão A4
      let altura = 297;
      
      switch (formatoPagina) {
        case "A4":
          largura = 210;
          altura = 297;
          break;
        case "A5":
          largura = 148;
          altura = 210;
          break;
        case "Letter":
          largura = 216;
          altura = 279;
          break;
        case "Legal":
          largura = 216;
          altura = 356;
          break;
      }
      
      // Ajustar para orientação
      if (orientacao === "paisagem") {
        [largura, altura] = [altura, largura];
      }
      
      form.setValue("larguraPagina", largura);
      form.setValue("alturaPagina", altura);
      
      console.log(`Dimensões da página atualizadas para ${largura}x${altura} baseado no formato ${formatoPagina} e orientação ${orientacao}`);
    }
  }, [formatoPagina, orientacao, form]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="formatoPagina"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Formato da Página</FormLabel>
              <Select 
                onValueChange={(value) => {
                  console.log(`Formato da página alterado para: ${value}`);
                  field.onChange(value);
                }} 
                defaultValue={field.value}
              >
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
              <Select 
                onValueChange={(value) => {
                  console.log(`Orientação alterada para: ${value}`);
                  field.onChange(value);
                }} 
                defaultValue={field.value}
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
                    onChange={e => {
                      const value = Number(e.target.value);
                      console.log(`Largura da página alterada para: ${value}`);
                      field.onChange(value);
                    }}
                    onBlur={() => {
                      console.log(`Largura da página confirmada: ${field.value}`);
                    }}
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
                    onChange={e => {
                      const value = Number(e.target.value);
                      console.log(`Altura da página alterada para: ${value}`);
                      field.onChange(value);
                    }}
                    onBlur={() => {
                      console.log(`Altura da página confirmada: ${field.value}`);
                    }}
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
