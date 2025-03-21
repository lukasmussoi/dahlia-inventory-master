
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
import type { CampoEtiqueta } from "@/types/etiqueta";
import { Align } from "lucide-react";

type ElementosEtiquetaFieldsProps = {
  form: UseFormReturn<any>;
};

export function ElementosEtiquetaFields({ form }: ElementosEtiquetaFieldsProps) {
  const [camposAtuais, setCamposAtuais] = useState<CampoEtiqueta[]>([]);
  
  // Inicializa os campos com os valores padrão se ainda não existirem
  useEffect(() => {
    const elementosIniciais: CampoEtiqueta[] = [
      { tipo: 'nome', x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7, alinhamento: 'left', fonte: 'helvetica' },
      { tipo: 'codigo', x: 2, y: 1, largura: 40, altura: 3, tamanhoFonte: 6, alinhamento: 'left', fonte: 'helvetica' },
      { tipo: 'preco', x: 70, y: 5, largura: 20, altura: 5, tamanhoFonte: 8, alinhamento: 'right', fonte: 'helvetica-bold' },
    ];
    
    const camposAtuais = form.getValues('campos') || [];
    
    // Se não houver campos ou a quantidade for diferente, inicializa com os valores padrão
    if (!camposAtuais.length || camposAtuais.length !== elementosIniciais.length) {
      console.log("Inicializando campos com valores padrão");
      form.setValue('campos', elementosIniciais);
      setCamposAtuais(elementosIniciais);
    } else {
      // Garantir que todos os campos tenham valores válidos
      const camposCorrigidos = camposAtuais.map((campo: any, index: number) => {
        const campoInicial = elementosIniciais[index];
        return {
          tipo: campo.tipo || campoInicial.tipo,
          x: Number(campo.x || campoInicial.x),
          y: Number(campo.y || campoInicial.y),
          largura: Number(campo.largura || campoInicial.largura), 
          altura: Number(campo.altura || campoInicial.altura),
          tamanhoFonte: Number(campo.tamanhoFonte || campoInicial.tamanhoFonte),
          alinhamento: campo.alinhamento || campoInicial.alinhamento,
          fonte: campo.fonte || campoInicial.fonte
        } as CampoEtiqueta;
      });
      
      form.setValue('campos', camposCorrigidos);
      setCamposAtuais(camposCorrigidos);
    }
  }, [form]);

  const elementos = [
    { tipo: 'nome' as const, label: 'Nome do Produto' },
    { tipo: 'codigo' as const, label: 'Código de Barras' },
    { tipo: 'preco' as const, label: 'Preço' },
  ];

  const opcoesAlinhamento = [
    { valor: 'left', label: 'Esquerda' },
    { valor: 'center', label: 'Centro' },
    { valor: 'right', label: 'Direita' },
  ];

  const opcoesFonte = [
    { valor: 'helvetica', label: 'Helvetica Normal' },
    { valor: 'helvetica-bold', label: 'Helvetica Negrito' },
    { valor: 'helvetica-oblique', label: 'Helvetica Itálico' },
    { valor: 'times', label: 'Times New Roman' },
    { valor: 'times-bold', label: 'Times New Roman Negrito' },
    { valor: 'courier', label: 'Courier' },
    { valor: 'courier-bold', label: 'Courier Negrito' },
  ];

  return (
    <div className="space-y-6 overflow-y-auto max-h-[400px] pr-2">
      <h3 className="text-lg font-medium">Posicionamento dos Elementos</h3>
      
      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="visual" className="flex items-center gap-2">
            Visual
          </TabsTrigger>
          <TabsTrigger value="detalhado" className="flex items-center gap-2">
            Configuração Detalhada
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-4">
          <div className="bg-white p-4 border rounded shadow">
            <div className="relative border border-dashed border-gray-300 bg-white w-[180px] h-[20px]">
              {camposAtuais.map((campo, index) => (
                <div
                  key={`${campo.tipo}-${index}`}
                  className="absolute border border-gray-300 bg-gray-50 p-1 cursor-move"
                  style={{
                    left: campo.x * 2,
                    top: campo.y * 2,
                    width: campo.largura * 2,
                    height: campo.altura * 2,
                    fontSize: campo.tamanhoFonte * 1.5,
                    textAlign: campo.alinhamento as any,
                  }}
                >
                  {campo.tipo === 'nome' ? 'Elo Aro Invertível' :
                   campo.tipo === 'codigo' ? '****************' : 
                   'R$ 119,90'}
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Este é um editor visual básico. Para ajustes precisos, use a aba "Configuração Detalhada".
            </div>
          </div>
        </TabsContent>

        <TabsContent value="detalhado" className="space-y-4">
          {elementos.map((elemento, index) => (
            <div key={elemento.tipo} className="space-y-4 pb-4 border-b">
              <h4 className="font-medium">{elemento.label}</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`campos.${index}.tipo`}
                  render={({ field }) => (
                    <input type="hidden" {...field} value={elemento.tipo} />
                  )}
                />
                
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
                          onChange={e => field.onChange(Number(e.target.value) || 0)}
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
                          onChange={e => field.onChange(Number(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          onChange={e => field.onChange(Number(e.target.value) || 0)}
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
                          onChange={e => field.onChange(Number(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          onChange={e => field.onChange(Number(e.target.value) || 10)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`campos.${index}.alinhamento`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alinhamento</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o alinhamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {opcoesAlinhamento.map(opcao => (
                            <SelectItem key={opcao.valor} value={opcao.valor}>
                              {opcao.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`campos.${index}.fonte`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fonte</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a fonte" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {opcoesFonte.map(opcao => (
                            <SelectItem key={opcao.valor} value={opcao.valor}>
                              {opcao.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {elemento.tipo === 'preco' && (
                <div className="flex flex-row items-center mt-2 text-xs rounded-md bg-blue-50 p-2 text-blue-800">
                  <span className="mr-2">💡</span> 
                  <span>Para valores como "R$ 119,90" com alinhamento à direita, recomenda-se posicionar o elemento próximo à borda direita da etiqueta.</span>
                </div>
              )}
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
