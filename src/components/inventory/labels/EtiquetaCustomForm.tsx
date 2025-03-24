
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EtiquetaEditor } from './editor/EtiquetaEditor';
import { useEtiquetaCustomForm } from "@/hooks/useEtiquetaCustomForm";
import EtiquetaCreator from './editor/EtiquetaCreator';
import type { ModeloEtiqueta, CampoEtiqueta } from "@/types/etiqueta";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, WrenchIcon, ArrowLeft, ArrowRight, Layout, File, LayoutGrid } from "lucide-react";
import { useState, useEffect } from "react";

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  const { 
    form, 
    isLoading, 
    onSubmit, 
    pageAreaWarning, 
    corrigirDimensoesAutomaticamente,
    ajustarDimensoesAutomaticamente,
    toggleAjusteAutomatico 
  } = useEtiquetaCustomForm(modelo, onClose, onSuccess);
  
  const [useNewEditor, setUseNewEditor] = useState(true);

  // Função modificada para evitar a dupla submissão
  const handleSave = (data: any) => {
    console.log("EtiquetaCustomForm: Dados recebidos do editor:", data);
    
    // Se recebemos apenas um ID, significa que o salvamento já foi realizado pelo editor
    if (data && data.id && Object.keys(data).length === 1) {
      console.log("EtiquetaCustomForm: Salvamento já realizado pelo editor, apenas chamando callback de sucesso");
      onSuccess();
      return;
    }
    
    try {
      // Adaptar os dados do editor visual para o formato esperado pelo formulário
      form.setValue('nome', data.nome);
      form.setValue('descricao', data.descricao);
      form.setValue('campos', data.campos);
      form.setValue('largura', data.largura);
      form.setValue('altura', data.altura);
      form.setValue('formatoPagina', data.formatoPagina);
      form.setValue('orientacao', data.orientacao);
      form.setValue('margemSuperior', data.margemSuperior);
      form.setValue('margemInferior', data.margemInferior);
      form.setValue('margemEsquerda', data.margemEsquerda);
      form.setValue('margemDireita', data.margemDireita);
      form.setValue('espacamentoHorizontal', data.espacamentoHorizontal);
      form.setValue('espacamentoVertical', data.espacamentoVertical);
      form.setValue('larguraPagina', data.larguraPagina);
      form.setValue('alturaPagina', data.alturaPagina);
      
      console.log("EtiquetaCustomForm: Valores definidos no formulário, enviando...");
      
      // Submeter o formulário manualmente
      onSubmit(form.getValues());
    } catch (error) {
      console.error("Erro ao processar dados do editor:", error);
    }
  };

  // Usando o novo editor de etiquetas 
  if (useNewEditor) {
    return (
      <EtiquetaCreator 
        onClose={onClose}
        onSave={handleSave}
        initialData={modelo}
        autoAdjustDimensions={ajustarDimensoesAutomaticamente}
        onToggleAutoAdjust={toggleAjusteAutomatico}
      />
    );
  }

  // Editor antigo (mantido como fallback)
  return (
    <Form {...form}>
      <form onSubmit={(e) => {
        const submitButton = document.activeElement;
        // Só submete o form se o botão de submissão for clicado
        if (!submitButton || !submitButton.classList.contains('submit-button')) {
          e.preventDefault();
          return;
        }
        form.handleSubmit(onSubmit)(e);
      }} className="space-y-4">
        <div className="max-h-[80vh] overflow-y-auto pr-2 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do modelo</FormLabel>
                  <FormControl>
                    <Input {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Editor Visual
              </TabsTrigger>
              <TabsTrigger value="page-preview" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Layout da Página
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <File className="h-4 w-4" />
                Pré-visualização
              </TabsTrigger>
            </TabsList>

            {/* Usando o EditorVisual antigo temporariamente */}
            <TabsContent value="editor" className="space-y-2">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção!</AlertTitle>
                <AlertDescription>
                  Este é o editor visual antigo. Estamos migrando para um novo editor mais moderno e intuitivo.
                </AlertDescription>
              </Alert>

              {pageAreaWarning && (
                <Alert variant="warning">
                  <WrenchIcon className="h-4 w-4" />
                  <AlertTitle>Atenção!</AlertTitle>
                  <AlertDescription>
                    {pageAreaWarning}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="largura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Largura da etiqueta (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="w-full" />
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
                      <FormLabel>Altura da etiqueta (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="formatoPagina"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formato da página</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                          <option value="A4">A4 (210 x 297 mm)</option>
                          <option value="A5">A5 (148 x 210 mm)</option>
                          <option value="Carta">Carta (216 x 279 mm)</option>
                          <option value="Personalizado">Personalizado</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orientacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orientação da página</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                          <option value="retrato">Retrato</option>
                          <option value="paisagem">Paisagem</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.getValues("formatoPagina") === "Personalizado" && (
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="larguraPagina"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largura da página (mm)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="w-full" />
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
                        <FormLabel>Altura da página (mm)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="w-full" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="margemSuperior"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Margem superior (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="w-full" />
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
                      <FormLabel>Margem inferior (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="margemEsquerda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Margem esquerda (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="w-full" />
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
                      <FormLabel>Margem direita (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="espacamentoHorizontal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Espaçamento horizontal (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="w-full" />
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
                      <FormLabel>Espaçamento vertical (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {pageAreaWarning && (
                <div className="flex items-center justify-end space-x-2">
                  <FormItem>
                    <FormLabel className="text-sm text-muted-foreground">
                      Corrigir dimensões automaticamente?
                    </FormLabel>
                    <FormControl>
                      <Switch 
                        checked={ajustarDimensoesAutomaticamente} 
                        onCheckedChange={toggleAjusteAutomatico} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            </TabsContent>

            <TabsContent value="page-preview">
              <div className="text-center py-6">
                <p className="text-lg font-medium">Pré-visualização do layout da página em breve!</p>
                <p className="text-sm text-gray-500">Estamos trabalhando para trazer essa funcionalidade em breve.</p>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="text-center py-6">
                <p className="text-lg font-medium">Pré-visualização da etiqueta em breve!</p>
                <p className="text-sm text-gray-500">Estamos trabalhando para trazer essa funcionalidade em breve.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background border-t mt-4">
          <Button 
            variant="outline" 
            type="button" 
            onClick={onClose} 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={isLoading || (!!pageAreaWarning && !ajustarDimensoesAutomaticamente)}
            className="flex items-center gap-2 submit-button"
          >
            {isLoading ? "Salvando..." : (modelo?.id ? "Atualizar" : "Criar")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
