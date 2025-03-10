
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Layout, 
  File, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Settings
} from "lucide-react";
import { EtiquetaEditor } from './editor/EtiquetaEditor';
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  const { form, isLoading, onSubmit, pageAreaWarning, corrigirDimensoesAutomaticamente } = useEtiquetaCustomForm(modelo, onClose, onSuccess);
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor");
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col h-[75vh]">
          {/* Cabeçalho com campos principais e botões de navegação */}
          <div className="mb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do modelo</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant={activeView === "editor" ? "default" : "outline"} 
                  onClick={() => setActiveView("editor")}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Layout className="h-4 w-4" />
                  Editor Visual
                </Button>
                <Button 
                  type="button" 
                  variant={activeView === "preview" ? "default" : "outline"} 
                  onClick={() => setActiveView("preview")}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <File className="h-4 w-4" />
                  Pré-visualização
                </Button>
              </div>
              
              {activeView === "editor" && (
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleZoomOut}
                    className="p-1 h-8 w-8"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{zoomLevel}%</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleZoomIn}
                    className="p-1 h-8 w-8"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Área de conteúdo principal com rolagem */}
          <ScrollArea className="flex-grow rounded-md border">
            {activeView === "editor" ? (
              <div className="p-4">
                <FormField
                  control={form.control}
                  name="campos"
                  render={({ field }) => {
                    // Garantir que todos os campos tenham as propriedades obrigatórias
                    const camposValidos: CampoEtiqueta[] = field.value.map(campo => ({
                      tipo: campo.tipo || 'nome', // Valor padrão para garantir que sempre tenha um tipo válido
                      x: typeof campo.x === 'number' ? campo.x : 0,
                      y: typeof campo.y === 'number' ? campo.y : 0,
                      largura: typeof campo.largura === 'number' ? campo.largura : 40,
                      altura: typeof campo.altura === 'number' ? campo.altura : 10,
                      tamanhoFonte: typeof campo.tamanhoFonte === 'number' ? campo.tamanhoFonte : 8
                    }));

                    return (
                      <FormItem>
                        <FormControl>
                          <div 
                            style={{ 
                              transform: `scale(${zoomLevel / 100})`, 
                              transformOrigin: 'top left',
                              width: `${100 * (100 / zoomLevel)}%`
                            }}
                          >
                            <EtiquetaEditor
                              campos={camposValidos}
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
                              onCamposChange={(novoCampos) => {
                                // Garantir que todos os campos do array tenham as propriedades obrigatórias
                                const camposAtualizados = novoCampos.map(campo => ({
                                  tipo: campo.tipo || 'nome',
                                  x: typeof campo.x === 'number' ? campo.x : 0,
                                  y: typeof campo.y === 'number' ? campo.y : 0,
                                  largura: typeof campo.largura === 'number' ? campo.largura : 40,
                                  altura: typeof campo.altura === 'number' ? campo.altura : 10,
                                  tamanhoFonte: typeof campo.tamanhoFonte === 'number' ? campo.tamanhoFonte : 8
                                }));
                                field.onChange(camposAtualizados);
                              }}
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
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            ) : (
              <div className="p-4">
                <div className="bg-white p-4 border rounded">
                  <h3 className="text-lg font-medium mb-4">Pré-visualização da Página com Etiquetas</h3>
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative bg-white border border-gray-800 mb-4"
                      style={{
                        width: form.getValues('formatoPagina') === 'Personalizado' ? 
                          `${form.getValues('larguraPagina') * 0.5}px` : 
                          `${(form.getValues('orientacao') === 'retrato' ? 210 : 297) * 0.5}px`,
                        height: form.getValues('formatoPagina') === 'Personalizado' ? 
                          `${form.getValues('alturaPagina') * 0.5}px` : 
                          `${(form.getValues('orientacao') === 'retrato' ? 297 : 210) * 0.5}px`,
                      }}
                    >
                      {/* Área útil (com margens) */}
                      <div className="absolute border-2 border-gray-300 border-dashed"
                        style={{
                          left: `${form.getValues('margemEsquerda') * 0.5}px`,
                          top: `${form.getValues('margemSuperior') * 0.5}px`,
                          right: `${form.getValues('margemDireita') * 0.5}px`,
                          bottom: `${form.getValues('margemInferior') * 0.5}px`,
                        }}
                      >
                        {/* Grid de etiquetas calculado */}
                        {(() => {
                          const areaUtilLargura = (form.getValues('larguraPagina') || 210) - 
                                                  form.getValues('margemEsquerda') - 
                                                  form.getValues('margemDireita');
                          const areaUtilAltura = (form.getValues('alturaPagina') || 297) - 
                                                form.getValues('margemSuperior') - 
                                                form.getValues('margemInferior');
                          
                          const etiquetasPorLinha = Math.floor((areaUtilLargura + form.getValues('espacamentoHorizontal')) / 
                                                   (form.getValues('largura') + form.getValues('espacamentoHorizontal')));
                          const etiquetasPorColuna = Math.floor((areaUtilAltura + form.getValues('espacamentoVertical')) / 
                                                    (form.getValues('altura') + form.getValues('espacamentoVertical')));
                          
                          const etiquetas = [];
                          
                          for (let linha = 0; linha < etiquetasPorColuna; linha++) {
                            for (let coluna = 0; coluna < etiquetasPorLinha; coluna++) {
                              const posX = (form.getValues('margemEsquerda') + 
                                          coluna * (form.getValues('largura') + form.getValues('espacamentoHorizontal'))) * 0.5;
                              const posY = (form.getValues('margemSuperior') + 
                                          linha * (form.getValues('altura') + form.getValues('espacamentoVertical'))) * 0.5;
                              
                              etiquetas.push(
                                <div 
                                  key={`etiqueta-${linha}-${coluna}`}
                                  className="absolute border border-dashed border-gray-400"
                                  style={{
                                    left: `${posX}px`,
                                    top: `${posY}px`,
                                    width: `${form.getValues('largura') * 0.5}px`,
                                    height: `${form.getValues('altura') * 0.5}px`,
                                    backgroundColor: linha === 0 && coluna === 0 ? 'rgba(200, 220, 255, 0.3)' : 'transparent'
                                  }}
                                >
                                  {linha === 0 && coluna === 0 && form.getValues('campos').map((campo, index) => (
                                    <div
                                      key={`campo-preview-${index}`}
                                      className="absolute border border-dotted border-gray-400"
                                      style={{
                                        left: campo.x * 0.5,
                                        top: campo.y * 0.5,
                                        width: campo.largura * 0.5,
                                        height: campo.altura * 0.5,
                                        fontSize: campo.tamanhoFonte * 0.5,
                                        overflow: 'hidden'
                                      }}
                                    >
                                      <div className="text-xs truncate">
                                        {campo.tipo === 'nome' ? 'Nome do Produto' :
                                        campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                          }
                          
                          return etiquetas;
                        })()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Total de {(() => {
                        const areaUtilLargura = (form.getValues('larguraPagina') || 210) - 
                                              form.getValues('margemEsquerda') - 
                                              form.getValues('margemDireita');
                        const areaUtilAltura = (form.getValues('alturaPagina') || 297) - 
                                              form.getValues('margemSuperior') - 
                                              form.getValues('margemInferior');
                        
                        const etiquetasPorLinha = Math.floor((areaUtilLargura + form.getValues('espacamentoHorizontal')) / 
                                               (form.getValues('largura') + form.getValues('espacamentoHorizontal')));
                        const etiquetasPorColuna = Math.floor((areaUtilAltura + form.getValues('espacamentoVertical')) / 
                                                  (form.getValues('altura') + form.getValues('espacamentoVertical')));
                        
                        return etiquetasPorLinha * etiquetasPorColuna;
                      })()} etiquetas por página.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {pageAreaWarning && (
            <Alert variant="destructive" className="mt-4">
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
                  Corrigir automaticamente
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Barra de ações fixa no rodapé */}
        <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background border-t mt-4">
          <Button variant="outline" type="button" onClick={onClose} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !!pageAreaWarning}
            className="flex items-center gap-2"
          >
            {isLoading ? "Salvando..." : (modelo?.id ? "Atualizar" : "Criar")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
