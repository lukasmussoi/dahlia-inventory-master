import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EtiquetaEditor } from './editor/EtiquetaEditor';
import { useEtiquetaCustomForm } from "@/hooks/useEtiquetaCustomForm";
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
import { AlertCircle, WrenchIcon, ArrowLeft, ArrowRight, Layout, File, LayoutGrid } from "lucide-react";

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  const { form, isLoading, onSubmit, pageAreaWarning, corrigirDimensoesAutomaticamente } = useEtiquetaCustomForm(modelo, onClose, onSuccess);

  return (
    <Form {...form}>
      <form onSubmit={(e) => {
        const submitButton = e.nativeEvent.submitter;
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

            <TabsContent value="editor" className="space-y-6">
              <FormField
                control={form.control}
                name="campos"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <EtiquetaEditor
                        campos={field.value as CampoEtiqueta[]}
                        largura={form.getValues('largura')}
                        altura={form.getValues('altura')}
                        formatoPagina={form.getValues('formatoPagina')}
                        orientacao={form.getValues('orientacao')}
                        margemSuperior={form.getValues('margemSuperior')}
                        margemInferior={form.getValues('margemInferior')}
                        margemEsquerda={form.getValues('margemEsquerda')}
                        margemDireita={form.getValues('margemDireita')}
                        espacamentoHorizontal={form.getValues('espacamentoHorizontal')}
                        espacamentoVertical={form.getValues('espacamentoVertical')}
                        larguraPagina={form.getValues('larguraPagina')}
                        alturaPagina={form.getValues('alturaPagina')}
                        onCamposChange={(campos: CampoEtiqueta[]) => field.onChange(campos)}
                        onDimensoesChange={(largura, altura) => {
                          form.setValue('largura', largura);
                          form.setValue('altura', altura);
                        }}
                        onMargensChange={(margemSuperior, margemInferior, margemEsquerda, margemDireita) => {
                          form.setValue('margemSuperior', margemSuperior);
                          form.setValue('margemInferior', margemInferior);
                          form.setValue('margemEsquerda', margemEsquerda);
                          form.setValue('margemDireita', margemDireita);
                        }}
                        onEspacamentoChange={(espacamentoHorizontal, espacamentoVertical) => {
                          form.setValue('espacamentoHorizontal', espacamentoHorizontal);
                          form.setValue('espacamentoVertical', espacamentoVertical);
                        }}
                        onFormatoChange={(formatoPagina, orientacao, larguraPagina, alturaPagina) => {
                          form.setValue('formatoPagina', formatoPagina);
                          form.setValue('orientacao', orientacao);
                          if (larguraPagina) form.setValue('larguraPagina', larguraPagina);
                          if (alturaPagina) form.setValue('alturaPagina', alturaPagina);
                        }}
                        showPageView={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {pageAreaWarning && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Problema nas dimensões</AlertTitle>
                  <AlertDescription className="flex flex-col space-y-2">
                    <span>{pageAreaWarning}</span>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={corrigirDimensoesAutomaticamente}
                      className="w-fit"
                    >
                      <WrenchIcon className="h-4 w-4 mr-2" />
                      Corrigir automaticamente
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="page-preview" className="space-y-6">
              <FormField
                control={form.control}
                name="campos"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <EtiquetaEditor
                        campos={field.value as CampoEtiqueta[]}
                        largura={form.getValues('largura')}
                        altura={form.getValues('altura')}
                        formatoPagina={form.getValues('formatoPagina')}
                        orientacao={form.getValues('orientacao')}
                        margemSuperior={form.getValues('margemSuperior')}
                        margemInferior={form.getValues('margemInferior')}
                        margemEsquerda={form.getValues('margemEsquerda')}
                        margemDireita={form.getValues('margemDireita')}
                        espacamentoHorizontal={form.getValues('espacamentoHorizontal')}
                        espacamentoVertical={form.getValues('espacamentoVertical')}
                        larguraPagina={form.getValues('larguraPagina')}
                        alturaPagina={form.getValues('alturaPagina')}
                        onCamposChange={(campos: CampoEtiqueta[]) => field.onChange(campos)}
                        onDimensoesChange={(largura, altura) => {
                          form.setValue('largura', largura);
                          form.setValue('altura', altura);
                        }}
                        onMargensChange={(margemSuperior, margemInferior, margemEsquerda, margemDireita) => {
                          form.setValue('margemSuperior', margemSuperior);
                          form.setValue('margemInferior', margemInferior);
                          form.setValue('margemEsquerda', margemEsquerda);
                          form.setValue('margemDireita', margemDireita);
                        }}
                        onEspacamentoChange={(espacamentoHorizontal, espacamentoVertical) => {
                          form.setValue('espacamentoHorizontal', espacamentoHorizontal);
                          form.setValue('espacamentoVertical', espacamentoVertical);
                        }}
                        onFormatoChange={(formatoPagina, orientacao, larguraPagina, alturaPagina) => {
                          form.setValue('formatoPagina', formatoPagina);
                          form.setValue('orientacao', orientacao);
                          if (larguraPagina) form.setValue('larguraPagina', larguraPagina);
                          if (alturaPagina) form.setValue('alturaPagina', alturaPagina);
                        }}
                        showPageView={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="bg-white p-4 border rounded">
                <h3 className="text-lg font-medium mb-4">Pré-visualização da Etiqueta</h3>
                <div 
                  className="border border-dashed border-gray-300 relative bg-white"
                  style={{
                    width: `${form.getValues('largura') * 2}px`,
                    height: `${form.getValues('altura') * 2}px`,
                  }}
                >
                  {form.getValues('campos').map((campo, index) => (
                    <div
                      key={`${campo.tipo}-${index}`}
                      className="absolute"
                      style={{
                        left: campo.x * 2,
                        top: campo.y * 2,
                        width: campo.largura * 2,
                        height: campo.altura * 2,
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center p-1">
                        <div 
                          className="text-center truncate w-full"
                          style={{ fontSize: campo.tamanhoFonte * 2 }}
                        >
                          {campo.tipo === 'nome' ? 'Pingente Coroa Cristal' :
                          campo.tipo === 'codigo' ? '123456789' : 
                          'R$ 59,90'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Esta é uma prévia aproximada de como sua etiqueta aparecerá quando impressa.
                </div>
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
            disabled={isLoading || !!pageAreaWarning}
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
