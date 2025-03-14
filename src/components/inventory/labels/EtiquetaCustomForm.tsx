
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  WrenchIcon,
  ArrowLeft,
  ArrowRight,
  Layout,
  Copy,
  InfoIcon,
  Maximize,
  Settings
} from "lucide-react";
import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
    paginaDefinida,
    etiquetaDefinida,
    corrigirDimensoesAutomaticamente,
    duplicarModelo,
    otimizarLayout
  } = useEtiquetaCustomForm(modelo, onClose, onSuccess);
  
  const [configPainel, setConfigPainel] = useState<'pagina' | 'etiqueta' | 'elementos'>('pagina');
  const [paginaConfigurada, setPaginaConfigurada] = useState(!!modelo);

  // Verificar se a página está configurada
  useEffect(() => {
    const formatoPagina = form.getValues('formatoPagina');
    const orientacao = form.getValues('orientacao');
    
    if (formatoPagina) {
      if (formatoPagina === 'Personalizado') {
        const larguraPagina = form.getValues('larguraPagina');
        const alturaPagina = form.getValues('alturaPagina');
        setPaginaConfigurada(!!larguraPagina && !!alturaPagina);
      } else {
        setPaginaConfigurada(true);
      }
    }
  }, [form.watch('formatoPagina'), form.watch('larguraPagina'), form.watch('alturaPagina')]);
  
  // Monitorar quando a página é configurada para avançar automaticamente 
  useEffect(() => {
    if (paginaConfigurada && configPainel === 'pagina') {
      // Se a página foi configurada, avançar para configuração da etiqueta
      setConfigPainel('etiqueta');
    }
  }, [paginaConfigurada]);

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

          <Alert className="bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-700" />
            <AlertTitle className="text-blue-800">Como funciona o editor</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p>Para criar suas etiquetas personalizadas:</p>
              <ol className="list-decimal ml-5 space-y-1 mt-2">
                <li>Primeiro, defina as dimensões da <strong>página</strong> (fundo amarelo)</li>
                <li>Configure o tamanho das <strong>etiquetas</strong> (retângulos azuis)</li>
                <li>Adicione e posicione os <strong>elementos</strong> dentro das etiquetas</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="etiqueta-editor-unified">
            {/* Painéis de configuração */}
            <div className="etiqueta-controls-panel">
              <div className="w-full flex gap-4 mb-4">
                <Button 
                  type="button" 
                  variant={configPainel === 'pagina' ? 'default' : 'outline'} 
                  onClick={() => setConfigPainel('pagina')}
                  className="flex-1"
                >
                  <Layout className="h-4 w-4 mr-2" />
                  Configurar Página
                </Button>
                <Button 
                  type="button" 
                  variant={configPainel === 'etiqueta' ? 'default' : 'outline'} 
                  onClick={() => setConfigPainel('etiqueta')}
                  className="flex-1"
                  disabled={!paginaConfigurada}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Etiquetas
                </Button>
                <Button 
                  type="button" 
                  variant={configPainel === 'elementos' ? 'default' : 'outline'} 
                  onClick={() => setConfigPainel('elementos')}
                  className="flex-1"
                  disabled={!paginaConfigurada || !etiquetaDefinida}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 8h7" />
                    <path d="M8 12h8" />
                    <path d="M11 16h5" />
                  </svg>
                  Elementos
                </Button>
              </div>

              {configPainel === 'pagina' && (
                <div className="w-full space-y-4">
                  <h4 className="text-sm font-medium">Formato da página</h4>
                  <FormField
                    control={form.control}
                    name="formatoPagina"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="grid grid-cols-3 gap-4"
                          >
                            <div>
                              <RadioGroupItem value="A4" id="formato-a4" className="sr-only peer" />
                              <Label
                                htmlFor="formato-a4"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <span className="text-xl mb-1">A4</span>
                                <span className="text-xs text-muted-foreground">210 × 297 mm</span>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem value="A5" id="formato-a5" className="sr-only peer" />
                              <Label
                                htmlFor="formato-a5"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <span className="text-xl mb-1">A5</span>
                                <span className="text-xs text-muted-foreground">148 × 210 mm</span>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem value="Personalizado" id="formato-personalizado" className="sr-only peer" />
                              <Label
                                htmlFor="formato-personalizado"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <span className="text-xl mb-1">Personalizado</span>
                                <span className="text-xs text-muted-foreground">Tamanho customizado</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.getValues('formatoPagina') === 'Personalizado' && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="larguraPagina"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Largura da página (mm)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="20" 
                                max="300" 
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
                            <FormLabel>Altura da página (mm)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="20" 
                                max="420" 
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
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
                        <FormLabel>Orientação da página</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="grid grid-cols-2 gap-4"
                          >
                            <div>
                              <RadioGroupItem value="retrato" id="orientacao-retrato" className="sr-only peer" />
                              <Label
                                htmlFor="orientacao-retrato"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                                  <rect width="14" height="20" x="5" y="2" rx="2" />
                                </svg>
                                <span>Retrato</span>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem value="paisagem" id="orientacao-paisagem" className="sr-only peer" />
                              <Label
                                htmlFor="orientacao-paisagem"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                                  <rect width="20" height="14" x="2" y="5" rx="2" />
                                </svg>
                                <span>Paisagem</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Margens (mm)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name="margemSuperior"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Superior</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0" 
                                  max="50" 
                                  onChange={e => field.onChange(Number(e.target.value))}
                                />
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
                              <FormLabel>Inferior</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0" 
                                  max="50" 
                                  onChange={e => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="margemEsquerda"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Esquerda</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0" 
                                  max="50" 
                                  onChange={e => field.onChange(Number(e.target.value))}
                                />
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
                              <FormLabel>Direita</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min="0" 
                                  max="50" 
                                  onChange={e => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      onClick={() => {
                        if (form.getValues('formatoPagina') === 'Personalizado' && 
                            (!form.getValues('larguraPagina') || !form.getValues('alturaPagina'))) {
                          form.setError('formatoPagina', { 
                            message: 'Insira as dimensões da página personalizada' 
                          });
                          return;
                        }
                        // Se tudo estiver ok, avançar para a próxima etapa
                        setConfigPainel('etiqueta');
                        setPaginaConfigurada(true);
                      }}
                    >
                      Avançar para Configuração das Etiquetas
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {configPainel === 'etiqueta' && (
                <div className="w-full space-y-4">
                  <h4 className="text-sm font-medium">Dimensões da etiqueta</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="largura"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Largura da etiqueta (mm)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="10" 
                              max="210" 
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
                          <FormLabel>Altura da etiqueta (mm)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="5" 
                              max="297" 
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <h4 className="text-sm font-medium">Espaçamento entre etiquetas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="espacamentoHorizontal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Espaçamento horizontal (mm)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              max="20" 
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
                          <FormLabel>Espaçamento vertical (mm)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              max="20" 
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button 
                      type="button" 
                      onClick={otimizarLayout}
                      variant="outline"
                      className="w-full"
                    >
                      <Maximize className="h-4 w-4 mr-2" />
                      Otimizar Layout Automaticamente
                    </Button>
                    <span className="text-xs text-gray-500">
                      Ajusta automaticamente as dimensões das etiquetas para maximizar a quantidade por página.
                    </span>
                  </div>

                  {pageAreaWarning && (
                    <Alert variant="warning">
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

                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setConfigPainel('pagina')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar para Configuração da Página
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => {
                        if (pageAreaWarning) {
                          corrigirDimensoesAutomaticamente();
                        }
                        setConfigPainel('elementos');
                      }}
                      disabled={!!pageAreaWarning}
                    >
                      Avançar para Elementos
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {configPainel === 'elementos' && (
                <div className="w-full space-y-4">
                  <FormField
                    control={form.control}
                    name="campos"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium">Elementos da etiqueta</h4>
                            <p className="text-sm text-gray-500">
                              Agora personalize os elementos dentro da etiqueta. Arraste os elementos na visualização para reposicioná-los.
                            </p>
                            
                            <div className="space-y-2">
                              <Button 
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const campos = [...field.value];
                                  campos.push({
                                    tipo: 'nome',
                                    x: 2,
                                    y: 2,
                                    largura: 40,
                                    altura: 10,
                                    tamanhoFonte: 8
                                  });
                                  field.onChange(campos);
                                }}
                                className="mr-2"
                              >
                                + Nome do Produto
                              </Button>
                              
                              <Button 
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const campos = [...field.value];
                                  campos.push({
                                    tipo: 'codigo',
                                    x: 2,
                                    y: 14,
                                    largura: 40,
                                    altura: 10,
                                    tamanhoFonte: 8
                                  });
                                  field.onChange(campos);
                                }}
                                className="mr-2"
                              >
                                + Código de Barras
                              </Button>
                              
                              <Button 
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const campos = [...field.value];
                                  campos.push({
                                    tipo: 'preco',
                                    x: 44,
                                    y: 2,
                                    largura: 30,
                                    altura: 10,
                                    tamanhoFonte: 10
                                  });
                                  field.onChange(campos);
                                }}
                              >
                                + Preço
                              </Button>
                            </div>
                            
                            {field.value.length > 0 && (
                              <div className="border rounded p-4 space-y-2">
                                <h5 className="font-medium text-sm">Elementos adicionados</h5>
                                {field.value.map((campo, index) => (
                                  <div key={`${campo.tipo}-${index}`} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span>
                                      {campo.tipo === 'nome' ? 'Nome do Produto' : 
                                       campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
                                    </span>
                                    <Button 
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const campos = [...field.value];
                                        campos.splice(index, 1);
                                        field.onChange(campos);
                                      }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                      </svg>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setConfigPainel('etiqueta')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar para Configuração das Etiquetas
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Visualização unificada */}
            <FormField
              control={form.control}
              name="campos"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <div className="etiqueta-page-container">
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
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-4 sticky bottom-0 bg-background border-t mt-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              type="button" 
              onClick={onClose} 
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancelar
            </Button>
            
            {modelo?.id && (
              <Button 
                variant="outline" 
                type="button" 
                onClick={duplicarModelo}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Duplicar Modelo
              </Button>
            )}
          </div>
          
          <Button 
            type="submit"
            disabled={isLoading || !!pageAreaWarning || (!etiquetaDefinida && !modelo?.id)}
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
