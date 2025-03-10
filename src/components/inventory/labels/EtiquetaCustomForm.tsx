
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CampoEtiqueta, EtiquetaCustomModel, ModeloEtiqueta } from "@/models/etiquetaCustomModel";

const etiquetaSchema = z.object({
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  largura: z.number().min(10, "Largura mínima de 10mm"),
  altura: z.number().min(10, "Altura mínima de 10mm"),
  formatoPagina: z.string(),
  orientacao: z.string(),
  margemSuperior: z.number().min(0),
  margemInferior: z.number().min(0),
  margemEsquerda: z.number().min(0),
  margemDireita: z.number().min(0),
  espacamentoHorizontal: z.number().min(0),
  espacamentoVertical: z.number().min(0),
});

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Campos padrão para código de barras, nome e preço
  const camposPadrao: CampoEtiqueta[] = [
    {
      tipo: "codigo_barras",
      x: 10,
      y: 10,
      largura: 40,
      altura: 10,
      valor: "",
      mostrarCodigo: true
    },
    {
      tipo: "texto",
      x: 10,
      y: 25,
      largura: 80,
      altura: 10,
      valor: "{nome}",
      tamanhoFonte: 10
    },
    {
      tipo: "preco",
      x: 70,
      y: 10,
      largura: 20,
      altura: 10,
      valor: "{preco}",
      tamanhoFonte: 12,
      negrito: true,
      moeda: "R$"
    }
  ];

  const form = useForm<z.infer<typeof etiquetaSchema>>({
    resolver: zodResolver(etiquetaSchema),
    defaultValues: {
      descricao: modelo?.descricao || "",
      largura: modelo?.largura || 80,
      altura: modelo?.altura || 40,
      formatoPagina: modelo?.formatoPagina || "A4",
      orientacao: modelo?.orientacao || "retrato",
      margemSuperior: modelo?.margemSuperior || 10,
      margemInferior: modelo?.margemInferior || 10,
      margemEsquerda: modelo?.margemEsquerda || 10,
      margemDireita: modelo?.margemDireita || 10,
      espacamentoHorizontal: modelo?.espacamentoHorizontal || 0,
      espacamentoVertical: modelo?.espacamentoVertical || 0,
    },
  });

  async function onSubmit(values: z.infer<typeof etiquetaSchema>) {
    try {
      setIsLoading(true);

      const modeloData: ModeloEtiqueta = {
        ...values,
        campos: modelo?.campos || camposPadrao,
      };

      let success: boolean | string | null;
      if (modelo?.id) {
        success = await EtiquetaCustomModel.update(modelo.id, modeloData);
      } else {
        success = await EtiquetaCustomModel.create(modeloData);
      }

      if (success) {
        toast.success(modelo?.id ? "Modelo atualizado com sucesso!" : "Modelo criado com sucesso!");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      toast.error("Erro ao salvar modelo de etiqueta");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Etiqueta Padrão 80x40mm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="largura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Largura (mm)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} 
                    onChange={e => field.onChange(Number(e.target.value))}
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
                <FormLabel>Altura (mm)</FormLabel>
                <FormControl>
                  <Input type="number" {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
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
            name="formatoPagina"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formato da Página</FormLabel>
                <Select
                  onValueChange={field.onChange}
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

        <div className="grid grid-cols-2 gap-4">
          {["margemSuperior", "margemInferior", "margemEsquerda", "margemDireita"].map((margin) => (
            <FormField
              key={margin}
              control={form.control}
              name={margin as keyof z.infer<typeof etiquetaSchema>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {margin === "margemSuperior" ? "Margem Superior" :
                     margin === "margemInferior" ? "Margem Inferior" :
                     margin === "margemEsquerda" ? "Margem Esquerda" :
                     "Margem Direita"} (mm)
                  </FormLabel>
                  <FormControl>
                    <Input type="number" {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="espacamentoHorizontal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Espaçamento Horizontal (mm)</FormLabel>
                <FormControl>
                  <Input type="number" {...field}
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
                <FormLabel>Espaçamento Vertical (mm)</FormLabel>
                <FormControl>
                  <Input type="number" {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : (modelo?.id ? "Atualizar" : "Criar")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
