
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
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertCircle,
  Check,
  Copy,
  Eye,
  FileText,
  HelpCircle,
  Info,
  Layout,
  Maximize,
  Minus,
  Plus,
  Printer,
  Save,
  Settings,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  
  const [currentStep, setCurrentStep] = useState<'pagina' | 'etiqueta' | 'elementos'>('pagina');
  const [paginaConfigurada, setPaginaConfigurada] = useState(!!modelo);
  const [etiquetaConfigurada, setEtiquetaConfigurada] = useState(!!modelo?.campos?.length);

  // Verificar se a página está configurada
  useEffect(() => {
    const formatoPagina = form.getValues('formatoPagina');
    
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
  
  // Verificar se a etiqueta está configurada
  useEffect(() => {
    const largura = form.getValues('largura');
    const altura = form.getValues('altura');
    setEtiquetaConfigurada(!!largura && !!altura && largura > 0 && altura > 0);
  }, [form.watch('largura'), form.watch('altura')]);

  // Função para avançar para o próximo passo
  const goToNextStep = () => {
    if (currentStep === 'pagina') {
      if (!paginaConfigurada) {
        form.setError('formatoPagina', { 
          message: 'Configure as dimensões da página antes de continuar' 
        });
        return;
      }
      setCurrentStep('etiqueta');
    } else if (currentStep === 'etiqueta') {
      if (!etiquetaConfigurada) {
        form.setError('largura', { 
          message: 'Configure as dimensões da etiqueta antes de continuar' 
        });
        return;
      }
      // Se houver problemas com as dimensões, corrigir automaticamente
      if (pageAreaWarning) {
        corrigirDimensoesAutomaticamente();
      }
      setCurrentStep('elementos');
    }
  };

  // Função para voltar ao passo anterior
  const goToPreviousStep = () => {
    if (currentStep === 'etiqueta') {
      setCurrentStep('pagina');
    } else if (currentStep === 'elementos') {
      setCurrentStep('etiqueta');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => {
        e.preventDefault();
        if (pageAreaWarning) {
          corrigirDimensoesAutomaticamente();
        }
        form.handleSubmit(onSubmit)(e);
      }} className="space-y-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
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

        {/* Assistente de passos */}
        <div className="etiqueta-wizard">
          <div className={`etiqueta-wizard-step ${currentStep === 'pagina' ? 'active' : (paginaConfigurada ? 'completed' : '')}`}>
            <div className="etiqueta-wizard-step-icon">
              {paginaConfigurada && currentStep !== 'pagina' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <span>1</span>
              )}
            </div>
            <span>Configurar Página</span>
          </div>
          <div className={`etiqueta-wizard-step ${currentStep === 'etiqueta' ? 'active' : (etiquetaConfigurada && currentStep === 'elementos' ? 'completed' : '')}`}>
            <div className="etiqueta-wizard-step-icon">
              {etiquetaConfigurada && currentStep === 'elementos' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <span>2</span>
              )}
            </div>
            <span>Tamanho da Etiqueta</span>
          </div>
          <div className={`etiqueta-wizard-step ${currentStep === 'elementos' ? 'active' : ''}`}>
            <div className="etiqueta-wizard-step-icon">
              <span>3</span>
            </div>
            <span>Elementos</span>
          </div>
        </div>

        <div className="etiqueta-editor-2col">
          {/* Coluna de configuração */}
          <div className="etiqueta-config-card">
            {currentStep === 'pagina' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Configuração da Página</h3>
                
                <FormField
                  control={form.control}
                  name="formatoPagina"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formato da Página</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center">
                              <HelpCircle className="h-4 w-4 text-muted-foreground ml-1" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Selecione o formato de papel onde as etiquetas serão impressas</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                            <RadioGroupItem value="Letter" id="formato-letter" className="sr-only peer" />
                            <Label
                              htmlFor="formato-letter"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              <span className="text-xl mb-1">Letter</span>
                              <span className="text-xs text-muted-foreground">215.9 × 279.4 mm</span>
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
                              <Layout className="h-6 w-6 mb-2" />
                              <span>Retrato</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="paisagem" id="orientacao-paisagem" className="sr-only peer" />
                            <Label
                              htmlFor="orientacao-paisagem"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 mb-2">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
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

                {form.getValues('formatoPagina') === 'Personalizado' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="larguraPagina"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Largura (mm)</FormLabel>
                          <div className="flex items-center gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => field.onChange(Math.max(20, Number(field.value) - 5))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="20" 
                                max="300" 
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => field.onChange(Math.min(300, Number(field.value) + 5))}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <FormDescription>
                            Entre 20 e 300 mm
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="alturaPagina"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Altura (mm)</FormLabel>
                          <div className="flex items-center gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => field.onChange(Math.max(20, Number(field.value) - 5))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="20" 
                                max="420" 
                                onChange={e => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => field.onChange(Math.min(420, Number(field.value) + 5))}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <FormDescription>
                            Entre 20 e 420 mm
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-3">Margens da página (mm)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="margemSuperior"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-xs">Superior</FormLabel>
                            <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                              {field.value} mm
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              min={0}
                              max={50}
                              step={1}
                              onValueChange={(value) => field.onChange(value[0])}
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
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-xs">Inferior</FormLabel>
                            <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                              {field.value} mm
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              min={0}
                              max={50}
                              step={1}
                              onValueChange={(value) => field.onChange(value[0])}
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
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-xs">Esquerda</FormLabel>
                            <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                              {field.value} mm
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              min={0}
                              max={50}
                              step={1}
                              onValueChange={(value) => field.onChange(value[0])}
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
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-xs">Direita</FormLabel>
                            <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                              {field.value} mm
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              min={0}
                              max={50}
                              step={1}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'etiqueta' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Configuração da Etiqueta</h3>
                
                <Tabs defaultValue="dimensoes" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 h-auto">
                    <TabsTrigger value="dimensoes" className="py-2">Dimensões</TabsTrigger>
                    <TabsTrigger value="otimizar" className="py-2">Otimizar</TabsTrigger>
                  </TabsList>
                  <TabsContent value="dimensoes" className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="largura"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center mb-1">
                              <FormLabel className="text-sm">Largura da etiqueta</FormLabel>
                              <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                                {field.value} mm
                              </span>
                            </div>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={() => field.onChange(Math.max(5, Number(field.value) - 5))}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Slider
                                  value={[field.value]}
                                  min={5}
                                  max={Math.min(200, form.getValues('larguraPagina') || 210)}
                                  step={1}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={() => field.onChange(Math.min(200, (form.getValues('larguraPagina') || 210), Number(field.value) + 5))}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
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
                            <div className="flex justify-between items-center mb-1">
                              <FormLabel className="text-sm">Altura da etiqueta</FormLabel>
                              <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                                {field.value} mm
                              </span>
                            </div>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={() => field.onChange(Math.max(5, Number(field.value) - 5))}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Slider
                                  value={[field.value]}
                                  min={5}
                                  max={Math.min(200, form.getValues('alturaPagina') || 297)}
                                  step={1}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={() => field.onChange(Math.min(200, (form.getValues('alturaPagina') || 297), Number(field.value) + 5))}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="espacamentoHorizontal"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center mb-1">
                              <FormLabel className="text-sm">Espaço horizontal</FormLabel>
                              <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                                {field.value} mm
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                value={[field.value]}
                                min={0}
                                max={20}
                                step={1}
                                onValueChange={(value) => field.onChange(value[0])}
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
                            <div className="flex justify-between items-center mb-1">
                              <FormLabel className="text-sm">Espaço vertical</FormLabel>
                              <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                                {field.value} mm
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                value={[field.value]}
                                min={0}
                                max={20}
                                step={1}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  
                    {pageAreaWarning && (
                      <Alert variant="warning" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Aviso</AlertTitle>
                        <AlertDescription className="flex flex-col space-y-2">
                          <span>{pageAreaWarning}</span>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={corrigirDimensoesAutomaticamente}
                            className="w-fit"
                            size="sm"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Corrigir automaticamente
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                  <TabsContent value="otimizar" className="pt-4 space-y-4">
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">Otimização automática</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        O assistente irá calcular o melhor tamanho para suas etiquetas, 
                        maximizando a quantidade por página com base no formato do papel escolhido.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      type="button" 
                      onClick={otimizarLayout}
                      className="w-full flex items-center gap-2"
                      size="lg"
                    >
                      <Maximize className="h-5 w-5 mr-1" />
                      Otimizar automaticamente
                    </Button>
                    
                    <div className="mt-4 text-sm text-gray-500">
                      <p>A otimização irá:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Calcular o tamanho ideal das etiquetas</li>
                        <li>Maximizar o número de etiquetas por página</li>
                        <li>Ajustar automaticamente o espaçamento</li>
                        <li>Manter proporções adequadas para os elementos</li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {currentStep === 'elementos' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Elementos da Etiqueta</h3>
                
                <FormField
                  control={form.control}
                  name="campos"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-500">
                            Adicione os elementos desejados à sua etiqueta. Você pode arrastar e posicionar diretamente na visualização.
                          </p>
                          
                          <div className="flex flex-wrap gap-2">
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
                              className="flex items-center"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Nome do Produto
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
                              className="flex items-center"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Código de Barras
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
                              className="flex items-center"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Preço
                            </Button>
                          </div>
                          
                          {field.value.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-2">Elementos incluídos</h4>
                              <div className="space-y-2">
                                {field.value.map((campo, index) => (
                                  <div key={`${campo.tipo}-${index}`} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                                    <span className="text-sm">
                                      {campo.tipo === 'nome' ? 'Nome do Produto' : 
                                       campo.tipo === 'codigo' ? 'Código de Barras' : 'Preço'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">
                                        {campo.x},{campo.y} • {campo.tamanhoFonte}pt
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
                                        className="h-7 w-7 p-0"
                                      >
                                        <X className="h-3.5 w-3.5 text-gray-500" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {field.value.length === 0 && (
                            <div className="border rounded-md p-4 flex flex-col items-center justify-center text-center text-gray-500 my-6">
                              <FileText className="h-10 w-10 mb-2 text-gray-400" />
                              <p className="text-sm">Nenhum elemento adicionado</p>
                              <p className="text-xs mt-1">Adicione elementos usando os botões acima</p>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Botões de navegação */}
            <div className="flex justify-between mt-6 pt-4 border-t">
              {currentStep !== 'pagina' ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goToPreviousStep}
                  className="flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Voltar
                </Button>
              ) : (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
              
              {currentStep !== 'elementos' ? (
                <Button 
                  type="button" 
                  onClick={goToNextStep}
                  className="flex items-center gap-1"
                >
                  {currentStep === 'pagina' ? 'Configurar Etiqueta' : 'Adicionar Elementos'}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Button>
              ) : (
                <div className="flex gap-2">
                  {modelo?.id && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={duplicarModelo}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicar
                    </Button>
                  )}
                  <Button 
                    type="submit"
                    className="flex items-center gap-1"
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isLoading ? "Salvando..." : (modelo?.id ? "Atualizar" : "Criar")}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Coluna de pré-visualização */}
          <div className="etiqueta-preview-container">
            <div className="etiqueta-preview-card">
              <div className="etiqueta-preview-title mb-3">
                <Eye className="h-4 w-4" />
                <span>Pré-visualização</span>
              </div>
              <FormField
                control={form.control}
                name="campos"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <div className="etiqueta-preview-content">
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
            
            <div className="text-xs text-gray-500 px-2">
              <p className="flex items-center gap-1 mb-1">
                <Printer className="h-3 w-3" />
                <span>Legenda: <span className="bg-[#FFFFD0] px-1">Página</span> • <span className="bg-[rgba(59,130,246,0.2)] px-1 border border-[rgba(59,130,246,0.5)]">Etiquetas</span></span>
              </p>
              <p>Use a roda do mouse ou os controles de zoom para ampliar a visualização.</p>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
