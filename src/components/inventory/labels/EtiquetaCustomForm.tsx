
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
  Settings,
  Printer,
  Save
} from "lucide-react";
import { EtiquetaEditor } from './editor/EtiquetaEditor';
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type EtiquetaCustomFormProps = {
  modelo?: ModeloEtiqueta;
  onClose: () => void;
  onSuccess: () => void;
};

export function EtiquetaCustomForm({ modelo, onClose, onSuccess }: EtiquetaCustomFormProps) {
  const { form, isLoading, onSubmit, pageAreaWarning, corrigirDimensoesAutomaticamente } = useEtiquetaCustomForm(modelo, onClose, onSuccess);
  const [activeMode, setActiveMode] = useState<"editor" | "preview" | "page-view">("editor");
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="px-0 pt-0 pb-3">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do modelo</FormLabel>
                <FormControl>
                  <Input {...field} className="max-w-full" />
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
                  <Input {...field} className="max-w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-5">
        <Form {...form}>
          <form id="etiqueta-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Barra de ferramentas do editor */}
            <div className="flex flex-wrap justify-between items-center gap-2 bg-muted/30 rounded-md p-2 mb-3 border">
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  type="button" 
                  variant={activeMode === "editor" ? "default" : "outline"} 
                  onClick={() => setActiveMode("editor")}
                  className="flex items-center gap-1 h-8 px-2 py-1"
                  size="sm"
                >
                  <Layout className="h-3.5 w-3.5" />
                  <span>Editor</span>
                </Button>
                <Button 
                  type="button" 
                  variant={activeMode === "preview" ? "default" : "outline"} 
                  onClick={() => setActiveMode("preview")}
                  className="flex items-center gap-1 h-8 px-2 py-1"
                  size="sm"
                >
                  <File className="h-3.5 w-3.5" />
                  <span>Etiqueta</span>
                </Button>
                <Button 
                  type="button" 
                  variant={activeMode === "page-view" ? "default" : "outline"} 
                  onClick={() => setActiveMode("page-view")}
                  className="flex items-center gap-1 h-8 px-2 py-1"
                  size="sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Página</span>
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleZoomOut}
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetZoom}
                  className="h-8 w-auto px-2 text-xs"
                >
                  {zoomLevel}%
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleZoomIn}
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 h-[calc(60vh-120px)] min-h-[400px]">
              {/* Área principal do editor com altura fixa e borda */}
              <div className="border rounded-md flex-grow overflow-hidden bg-white flex flex-col">
                <ScrollArea className="flex-grow">
                  <div className="p-4 flex items-center justify-center min-h-[380px]">
                    {activeMode === "editor" && (
                      <FormField
                        control={form.control}
                        name="campos"
                        render={({ field }) => {
                          // Garantir que todos os campos tenham as propriedades obrigatórias
                          const camposValidos: CampoEtiqueta[] = field.value.map(campo => ({
                            tipo: campo.tipo,
                            x: typeof campo.x === 'number' ? campo.x : 0,
                            y: typeof campo.y === 'number' ? campo.y : 0,
                            largura: typeof campo.largura === 'number' ? campo.largura : 40,
                            altura: typeof campo.altura === 'number' ? campo.altura : 10,
                            tamanhoFonte: typeof campo.tamanhoFonte === 'number' ? campo.tamanhoFonte : 8
                          }));

                          return (
                            <FormItem className="w-full">
                              <FormControl>
                                <div 
                                  style={{ 
                                    transform: `scale(${zoomLevel / 100})`, 
                                    transformOrigin: 'center',
                                    width: `${100 * (100 / zoomLevel)}%`,
                                    height: `${100 * (100 / zoomLevel)}%`,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
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
                                        tipo: campo.tipo,
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
                    )}

                    {/* Visualização da etiqueta individual */}
                    {activeMode === "preview" && (
                      <div className="bg-white p-4 border rounded-md shadow-sm w-fit mx-auto">
                        <h3 className="text-sm font-medium mb-2 text-center">Visualização da Etiqueta</h3>
                        <div className="flex flex-col items-center">
                          <div 
                            className="relative bg-white border border-gray-300" 
                            style={{
                              width: `${form.getValues('largura') * (zoomLevel / 100)}px`,
                              height: `${form.getValues('altura') * (zoomLevel / 100)}px`,
                            }}
                          >
                            {form.getValues('campos').map((campo, index) => (
                              <div
                                key={`campo-preview-${index}`}
                                className="absolute border border-dotted border-gray-400"
                                style={{
                                  left: campo.x * (zoomLevel / 100),
                                  top: campo.y * (zoomLevel / 100),
                                  width: campo.largura * (zoomLevel / 100),
                                  height: campo.altura * (zoomLevel / 100),
                                  fontSize: campo.tamanhoFonte * (zoomLevel / 100),
                                  overflow: 'hidden'
                                }}
                              >
                                <div className="truncate px-1 text-xs">
                                  {campo.tipo === 'nome' ? 'Nome do Produto' :
                                  campo.tipo === 'codigo' ? 'Código de Barras' : 'R$ 99,90'}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Dimensões: {form.getValues('largura')}mm × {form.getValues('altura')}mm
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visualização da página completa */}
                    {activeMode === "page-view" && (
                      <div className="bg-white p-4 border rounded-md shadow-sm w-fit mx-auto">
                        <h3 className="text-sm font-medium mb-2 text-center">Visualização da Página</h3>
                        <div className="flex flex-col items-center">
                          <div 
                            className="relative bg-white border border-gray-800 mb-2"
                            style={{
                              width: form.getValues('formatoPagina') === 'Personalizado' ? 
                                `${form.getValues('larguraPagina') * (zoomLevel / 100)}px` : 
                                `${(form.getValues('orientacao') === 'retrato' ? 210 : 297) * (zoomLevel / 100)}px`,
                              height: form.getValues('formatoPagina') === 'Personalizado' ? 
                                `${form.getValues('alturaPagina') * (zoomLevel / 100)}px` : 
                                `${(form.getValues('orientacao') === 'retrato' ? 297 : 210) * (zoomLevel / 100)}px`,
                            }}
                          >
                            {/* Área útil (com margens) */}
                            <div 
                              className="absolute border-2 border-gray-300 border-dashed"
                              style={{
                                left: `${form.getValues('margemEsquerda') * (zoomLevel / 100)}px`,
                                top: `${form.getValues('margemSuperior') * (zoomLevel / 100)}px`,
                                right: `${form.getValues('margemDireita') * (zoomLevel / 100)}px`,
                                bottom: `${form.getValues('margemInferior') * (zoomLevel / 100)}px`,
                              }}
                            >
                              {/* Grid de etiquetas calculado */}
                              {(() => {
                                const formatoPagina = form.getValues('formatoPagina');
                                const orientacao = form.getValues('orientacao');

                                // Determinar largura e altura da página de acordo com o formato e orientação
                                let larguraPagina = 210;  // Padrão A4
                                let alturaPagina = 297;   // Padrão A4

                                if (formatoPagina === "Personalizado" && form.getValues('larguraPagina') && form.getValues('alturaPagina')) {
                                  larguraPagina = form.getValues('larguraPagina');
                                  alturaPagina = form.getValues('alturaPagina');
                                } else if (orientacao === "paisagem") {
                                  // Inverter dimensões para paisagem
                                  [larguraPagina, alturaPagina] = [alturaPagina, larguraPagina];
                                }

                                const margemSuperior = form.getValues('margemSuperior');
                                const margemInferior = form.getValues('margemInferior');
                                const margemEsquerda = form.getValues('margemEsquerda');
                                const margemDireita = form.getValues('margemDireita');
                                const espacamentoHorizontal = form.getValues('espacamentoHorizontal');
                                const espacamentoVertical = form.getValues('espacamentoVertical');
                                const larguraEtiqueta = form.getValues('largura');
                                const alturaEtiqueta = form.getValues('altura');

                                // Cálculo da área útil
                                const areaUtilLargura = larguraPagina - margemEsquerda - margemDireita;
                                const areaUtilAltura = alturaPagina - margemSuperior - margemInferior;

                                // Calcular quantas etiquetas cabem na horizontal e vertical
                                const etiquetasPorLinha = Math.floor(
                                  (areaUtilLargura + espacamentoHorizontal) / 
                                  (larguraEtiqueta + espacamentoHorizontal)
                                );
                                const etiquetasPorColuna = Math.floor(
                                  (areaUtilAltura + espacamentoVertical) / 
                                  (alturaEtiqueta + espacamentoVertical)
                                );

                                const etiquetas = [];

                                for (let linha = 0; linha < etiquetasPorColuna; linha++) {
                                  for (let coluna = 0; coluna < etiquetasPorLinha; coluna++) {
                                    const posX = (margemEsquerda + 
                                               coluna * (larguraEtiqueta + espacamentoHorizontal)) * (zoomLevel / 100);
                                    const posY = (margemSuperior + 
                                               linha * (alturaEtiqueta + espacamentoVertical)) * (zoomLevel / 100);

                                    etiquetas.push(
                                      <div 
                                        key={`etiqueta-${linha}-${coluna}`}
                                        className="absolute border border-gray-400"
                                        style={{
                                          left: `${posX}px`,
                                          top: `${posY}px`,
                                          width: `${larguraEtiqueta * (zoomLevel / 100)}px`,
                                          height: `${alturaEtiqueta * (zoomLevel / 100)}px`,
                                          backgroundColor: linha === 0 && coluna === 0 ? 'rgba(200, 220, 255, 0.3)' : 'transparent'
                                        }}
                                      >
                                        {linha === 0 && coluna === 0 && (
                                          <div className="w-full h-full relative overflow-hidden">
                                            {form.getValues('campos').map((campo, index) => (
                                              <div
                                                key={`campo-preview-${index}`}
                                                className="absolute border border-dotted border-gray-400"
                                                style={{
                                                  left: campo.x * (zoomLevel / 100),
                                                  top: campo.y * (zoomLevel / 100),
                                                  width: campo.largura * (zoomLevel / 100),
                                                  height: campo.altura * (zoomLevel / 100),
                                                  fontSize: `${campo.tamanhoFonte * (zoomLevel / 150)}px`,
                                                  overflow: 'hidden'
                                                }}
                                              >
                                                <span className="text-xs truncate block px-1">
                                                  {campo.tipo === 'nome' ? 'Nome do Produto' :
                                                   campo.tipo === 'codigo' ? 'Código' : 'R$ 99,90'}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                }

                                return etiquetas;
                              })()}
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            {(() => {
                              const formatoPagina = form.getValues('formatoPagina');
                              const orientacao = form.getValues('orientacao');
                              
                              // Determinar largura e altura da página
                              let larguraPagina = 210;  // Padrão A4
                              let alturaPagina = 297;   // Padrão A4
                              
                              if (formatoPagina === "Personalizado" && form.getValues('larguraPagina') && form.getValues('alturaPagina')) {
                                larguraPagina = form.getValues('larguraPagina');
                                alturaPagina = form.getValues('alturaPagina');
                              } else if (orientacao === "paisagem") {
                                // Inverter dimensões para paisagem
                                [larguraPagina, alturaPagina] = [alturaPagina, larguraPagina];
                              }
                              
                              const margemSuperior = form.getValues('margemSuperior');
                              const margemInferior = form.getValues('margemInferior');
                              const margemEsquerda = form.getValues('margemEsquerda');
                              const margemDireita = form.getValues('margemDireita');
                              const espacamentoHorizontal = form.getValues('espacamentoHorizontal');
                              const espacamentoVertical = form.getValues('espacamentoVertical');
                              const larguraEtiqueta = form.getValues('largura');
                              const alturaEtiqueta = form.getValues('altura');
                              
                              // Área útil
                              const areaUtilLargura = larguraPagina - margemEsquerda - margemDireita;
                              const areaUtilAltura = alturaPagina - margemSuperior - margemInferior;
                              
                              // Calcular quantas etiquetas cabem
                              const etiquetasPorLinha = Math.floor(
                                (areaUtilLargura + espacamentoHorizontal) / 
                                (larguraEtiqueta + espacamentoHorizontal)
                              );
                              const etiquetasPorColuna = Math.floor(
                                (areaUtilAltura + espacamentoVertical) / 
                                (alturaEtiqueta + espacamentoVertical)
                              );
                              
                              return `Página: ${formatoPagina} (${larguraPagina}mm × ${alturaPagina}mm) - ${etiquetasPorLinha * etiquetasPorColuna} etiquetas por página`;
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Painel lateral de configurações */}
              <div className="w-full lg:w-80 flex-shrink-0">
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">Configurações</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-4">
                    <Tabs defaultValue="dimensoes" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-2">
                        <TabsTrigger value="dimensoes" className="text-xs">Etiqueta</TabsTrigger>
                        <TabsTrigger value="pagina" className="text-xs">Página</TabsTrigger>
                        <TabsTrigger value="elementos" className="text-xs">Elementos</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="dimensoes" className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="largura"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Largura (mm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    value={field.value} 
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                    className="h-8 text-sm"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs"/>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="altura"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Altura (mm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    value={field.value} 
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                    className="h-8 text-sm"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs"/>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mt-1 mb-2">
                            Tamanho real da etiqueta: {form.getValues('largura')}mm × {form.getValues('altura')}mm
                          </p>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="pagina" className="space-y-3">
                        <FormField
                          control={form.control}
                          name="formatoPagina"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Formato da Página</FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                  <option value="A4">A4 (210mm × 297mm)</option>
                                  <option value="Letter">Carta (216mm × 279mm)</option>
                                  <option value="Personalizado">Personalizado</option>
                                </select>
                              </FormControl>
                              <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                        
                        {form.getValues('formatoPagina') === 'Personalizado' && (
                          <div className="grid grid-cols-2 gap-2">
                            <FormField
                              control={form.control}
                              name="larguraPagina"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Largura da Página (mm)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field} 
                                      value={field.value || 210} 
                                      onChange={e => field.onChange(parseFloat(e.target.value))}
                                      className="h-8 text-sm"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs"/>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="alturaPagina"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Altura da Página (mm)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field} 
                                      value={field.value || 297} 
                                      onChange={e => field.onChange(parseFloat(e.target.value))}
                                      className="h-8 text-sm"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs"/>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                        
                        <FormField
                          control={form.control}
                          name="orientacao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Orientação</FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                  <option value="retrato">Retrato</option>
                                  <option value="paisagem">Paisagem</option>
                                </select>
                              </FormControl>
                              <FormMessage className="text-xs"/>
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="margemSuperior"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Margem Superior (mm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    value={field.value} 
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                    className="h-8 text-sm"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs"/>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="margemInferior"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Margem Inferior (mm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    value={field.value} 
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                    className="h-8 text-sm"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs"/>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="margemEsquerda"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Margem Esquerda (mm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    value={field.value} 
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                    className="h-8 text-sm"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs"/>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="margemDireita"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Margem Direita (mm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    value={field.value} 
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                    className="h-8 text-sm"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs"/>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="espacamentoHorizontal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Espaçamento Horizontal (mm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    value={field.value} 
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                    className="h-8 text-sm"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs"/>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="espacamentoVertical"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Espaçamento Vertical (mm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    value={field.value} 
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                    className="h-8 text-sm"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs"/>
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="elementos" className="space-y-3">
                        <div className="mb-2">
                          <p className="text-xs font-medium mb-1">Elementos na Etiqueta</p>
                          <p className="text-xs text-muted-foreground">
                            Modifique os elementos no editor visual ou defina posições precisas aqui.
                          </p>
                        </div>
                        
                        {form.getValues('campos').map((campo, index) => (
                          <Card key={`campo-config-${index}`} className="border p-2">
                            <CardHeader className="p-0 pb-1">
                              <CardTitle className="text-xs font-medium">
                                {campo.tipo === 'nome' ? 'Nome do Produto' : 
                                 campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <FormLabel className="text-xs">Posição X</FormLabel>
                                  <Input 
                                    type="number" 
                                    value={campo.x}
                                    onChange={e => {
                                      const campos = [...form.getValues('campos')];
                                      campos[index] = {
                                        ...campos[index],
                                        x: parseFloat(e.target.value)
                                      };
                                      form.setValue('campos', campos);
                                    }}
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div>
                                  <FormLabel className="text-xs">Posição Y</FormLabel>
                                  <Input 
                                    type="number" 
                                    value={campo.y}
                                    onChange={e => {
                                      const campos = [...form.getValues('campos')];
                                      campos[index] = {
                                        ...campos[index],
                                        y: parseFloat(e.target.value)
                                      };
                                      form.setValue('campos', campos);
                                    }}
                                    className="h-7 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <FormLabel className="text-xs">Largura</FormLabel>
                                  <Input 
                                    type="number" 
                                    value={campo.largura}
                                    onChange={e => {
                                      const campos = [...form.getValues('campos')];
                                      campos[index] = {
                                        ...campos[index],
                                        largura: parseFloat(e.target.value)
                                      };
                                      form.setValue('campos', campos);
                                    }}
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div>
                                  <FormLabel className="text-xs">Altura</FormLabel>
                                  <Input 
                                    type="number" 
                                    value={campo.altura}
                                    onChange={e => {
                                      const campos = [...form.getValues('campos')];
                                      campos[index] = {
                                        ...campos[index],
                                        altura: parseFloat(e.target.value)
                                      };
                                      form.setValue('campos', campos);
                                    }}
                                    className="h-7 text-xs"
                                  />
                                </div>
                              </div>
                              <div>
                                <FormLabel className="text-xs">Tamanho da Fonte</FormLabel>
                                <Input 
                                  type="number" 
                                  value={campo.tamanhoFonte}
                                  onChange={e => {
                                    const campos = [...form.getValues('campos')];
                                    campos[index] = {
                                      ...campos[index],
                                      tamanhoFonte: parseFloat(e.target.value)
                                    };
                                    form.setValue('campos', campos);
                                  }}
                                  className="h-7 text-xs"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>

            {pageAreaWarning && (
              <Alert variant="destructive" className="my-3">
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
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 pt-2 px-0 sticky bottom-0 bg-background border-t">
        <Button variant="outline" type="button" onClick={onClose} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Cancelar
        </Button>
        <Button 
          type="submit"
          form="etiqueta-form"
          disabled={isLoading || !!pageAreaWarning}
          className="flex items-center gap-1"
        >
          <Save className="h-4 w-4" />
          {isLoading ? "Salvando..." : (modelo?.id ? "Atualizar" : "Criar")}
        </Button>
      </CardFooter>
    </Card>
  );
}
