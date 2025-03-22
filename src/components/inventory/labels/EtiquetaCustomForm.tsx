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
import { useState } from "react";

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

  const handleSave = (data: any) => {
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
    
    // Submeter o formulário
    form.handleSubmit(onSubmit)();
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
            {/* ... keep existing code (código do EditorVisual antigo) */}
            
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
