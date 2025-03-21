
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react"; // Corrigido: importações corretas dos ícones de alinhamento
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  campos: z.array(
    z.object({
      tipo: z.string(),
      x: z.number(),
      y: z.number(),
      largura: z.number(),
      altura: z.number(),
      tamanhoFonte: z.number(),
      alinhamento: z.enum(["left", "center", "right"]).optional(),
      fonte: z.string().optional(),
    })
  ),
});

type ElementosEtiquetaFieldsProps = {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  onAddCampo: (tipo: string) => void;
  onRemoveCampo: (index: number) => void;
};

export function ElementosEtiquetaFields({
  form,
  onAddCampo,
  onRemoveCampo,
}: ElementosEtiquetaFieldsProps) {
  const campos = form.watch("campos");

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Elementos da Etiqueta</h3>

      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onAddCampo("nome")}
        >
          + Nome do Produto
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onAddCampo("codigo")}
        >
          + Código de Barras
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onAddCampo("preco")}
        >
          + Preço
        </Button>
      </div>

      <div className="space-y-6">
        {campos.map((campo, index) => (
          <div
            key={index}
            className="border rounded-md p-4 space-y-4 relative bg-slate-50"
          >
            <Button
              type="button"
              variant="ghost"
              className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500"
              onClick={() => onRemoveCampo(index)}
            >
              ×
            </Button>

            <h4 className="font-medium">
              {campo.tipo === "nome"
                ? "Nome do Produto"
                : campo.tipo === "codigo"
                ? "Código de Barras"
                : "Preço"}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`campos.${index}.x`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posição X (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`campos.${index}.y`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posição Y (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                name={`campos.${index}.largura`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Largura (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`campos.${index}.altura`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altura (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                name={`campos.${index}.tamanhoFonte`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho da Fonte (pt)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Adicionado campo para seleção de fonte */}
              <FormField
                control={form.control}
                name={`campos.${index}.fonte`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue="helvetica"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a fonte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="helvetica">Helvetica</SelectItem>
                        <SelectItem value="times">Times</SelectItem>
                        <SelectItem value="courier">Courier</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campo para alinhamento */}
            <FormField
              control={form.control}
              name={`campos.${index}.alinhamento`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alinhamento</FormLabel>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant={field.value === "left" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => field.onChange("left")}
                    >
                      <AlignLeft className="h-4 w-4 mr-1" />
                      Esquerda
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === "center" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => field.onChange("center")}
                    >
                      <AlignCenter className="h-4 w-4 mr-1" />
                      Centro
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === "right" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => field.onChange("right")}
                    >
                      <AlignRight className="h-4 w-4 mr-1" />
                      Direita
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
