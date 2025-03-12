
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, AlertTriangle, MoreVertical, Pencil } from "lucide-react";
import { LabelModel } from "@/models/labelModel";
import { generatePdfLabel } from "@/utils/pdfUtils";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import { EtiquetaCustomForm } from "./EtiquetaCustomForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { ModeloEtiqueta } from "@/types/etiqueta";

interface PrintLabelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // Tipo do item a ser impresso
}

export function PrintLabelDialog({ isOpen, onClose, item }: PrintLabelDialogProps) {
  const [labelModel, setLabelModel] = useState("Padrão");
  const [copies, setCopies] = useState("1");
  const [startRow, setStartRow] = useState("1");
  const [startColumn, setStartColumn] = useState("1");
  const [multiplyByStock, setMultiplyByStock] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModeloForm, setShowModeloForm] = useState(false);
  const [modelosCustom, setModelosCustom] = useState<ModeloEtiqueta[]>([]);
  const [selectedModeloId, setSelectedModeloId] = useState<string | undefined>(undefined);
  const [selectedModelo, setSelectedModelo] = useState<ModeloEtiqueta | null>(null);
  const [modeloWarning, setModeloWarning] = useState<string | null>(null);
  const [modeloParaEditar, setModeloParaEditar] = useState<ModeloEtiqueta | null>(null);

  // Load custom models when dialog opens
  useEffect(() => {
    const loadModelosCustom = async () => {
      try {
        console.log("Carregando modelos de etiquetas personalizadas...");
        const modelos = await EtiquetaCustomModel.getAll();
        console.log("Modelos carregados:", modelos);
        setModelosCustom(modelos);
      } catch (error) {
        console.error("Erro ao carregar modelos:", error);
        toast.error("Erro ao carregar modelos de etiquetas");
      }
    };
    
    if (isOpen) {
      loadModelosCustom();
    }
  }, [isOpen]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCopies("1");
      setStartRow("1");
      setStartColumn("1");
      setMultiplyByStock(false);
      setSelectedModeloId(undefined);
      setSelectedModelo(null);
      setModeloWarning(null);
      setModeloParaEditar(null);
    }
  }, [isOpen]);

  // Carregar detalhes do modelo selecionado
  useEffect(() => {
    setModeloWarning(null);
    
    if (selectedModeloId) {
      const carregarModeloSelecionado = async () => {
        try {
          console.log("Carregando detalhes do modelo:", selectedModeloId);
          const modelo = await EtiquetaCustomModel.getById(selectedModeloId);
          console.log("Detalhes do modelo carregado:", modelo);
          
          if (modelo) {
            setSelectedModelo(modelo);
            console.log("Campos do modelo carregado:", modelo.campos);
            
            // Verificar se as dimensões são válidas
            if (modelo.formatoPagina === "Personalizado") {
              if (!modelo.larguraPagina || !modelo.alturaPagina) {
                setModeloWarning("Este modelo tem formato personalizado, mas as dimensões da página não estão definidas.");
                return;
              }
              
              // Verificar se a etiqueta cabe na página
              const areaUtilLargura = modelo.larguraPagina - modelo.margemEsquerda - modelo.margemDireita;
              if (modelo.largura > areaUtilLargura) {
                setModeloWarning(
                  `A largura da etiqueta (${modelo.largura}mm) é maior que a área útil disponível (${areaUtilLargura}mm). ` +
                  `Isso pode causar problemas na impressão. Considere editar o modelo.`
                );
                return;
              }
              
              const areaUtilAltura = modelo.alturaPagina - modelo.margemSuperior - modelo.margemInferior;
              if (modelo.altura > areaUtilAltura) {
                setModeloWarning(
                  `A altura da etiqueta (${modelo.altura}mm) é maior que a área útil disponível (${areaUtilAltura}mm). ` +
                  `Isso pode causar problemas na impressão. Considere editar o modelo.`
                );
                return;
              }
            }
          } else {
            console.error("Modelo não encontrado");
            toast.error("Erro ao carregar modelo de etiqueta");
          }
        } catch (error) {
          console.error("Erro ao carregar detalhes do modelo:", error);
          toast.error("Erro ao carregar modelo de etiqueta");
        }
      };
      
      carregarModeloSelecionado();
    } else {
      setSelectedModelo(null);
    }
  }, [selectedModeloId]);

  const validateInput = (): boolean => {
    if (!item) {
      toast.error("Nenhum item selecionado para impressão");
      return false;
    }

    const copiesNum = parseInt(copies);
    const startRowNum = parseInt(startRow);
    const startColNum = parseInt(startColumn);

    if (isNaN(copiesNum) || copiesNum < 1) {
      toast.error("Número de cópias deve ser pelo menos 1");
      return false;
    }

    if (isNaN(startRowNum) || startRowNum < 1) {
      toast.error("Linha de início deve ser pelo menos 1");
      return false;
    }

    if (isNaN(startColNum) || startColNum < 1) {
      toast.error("Coluna de início deve ser pelo menos 1");
      return false;
    }

    if (selectedModeloId && modeloWarning) {
      if (!confirm("O modelo selecionado pode ter problemas de impressão. Deseja continuar mesmo assim?")) {
        return false;
      }
    }

    return true;
  };

  const handlePrint = async () => {
    if (!validateInput()) return;

    try {
      setIsProcessing(true);
      console.log("Iniciando impressão com modelo:", selectedModeloId);
      console.log("Detalhes do modelo para impressão:", selectedModelo);
      console.log("Item para impressão:", item);

      // Usar a interface correta para o generatePdfLabel
      const pdfUrl = await generatePdfLabel({
        item,
        copies: parseInt(copies),
        startRow: parseInt(startRow),
        startColumn: parseInt(startColumn),
        multiplyByStock,
        selectedModeloId
      });

      // Registrar impressão no histórico
      await LabelModel.registerLabelPrint(item.id, parseInt(copies));

      // Abrir PDF em nova aba
      window.open(pdfUrl, '_blank');
      
      toast.success("Etiquetas geradas com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      if (error instanceof Error) {
        toast.error(`Erro ao gerar etiquetas: ${error.message}`);
      } else {
        toast.error("Erro ao gerar etiquetas. Por favor, tente novamente.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModeloSuccess = async () => {
    setShowModeloForm(false);
    setModeloParaEditar(null);
    try {
      const modelos = await EtiquetaCustomModel.getAll();
      setModelosCustom(modelos);
      toast.success("Modelo de etiqueta salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao recarregar modelos:", error);
    }
  };

  const editarModeloSelecionado = async () => {
    if (selectedModeloId) {
      try {
        const modelo = await EtiquetaCustomModel.getById(selectedModeloId);
        if (modelo) {
          setModeloParaEditar(modelo);
          setShowModeloForm(true);
        } else {
          toast.error("Erro ao carregar modelo para edição");
        }
      } catch (error) {
        console.error("Erro ao carregar modelo para edição:", error);
        toast.error("Erro ao carregar modelo para edição");
      }
    } else {
      toast.error("Nenhum modelo selecionado para editar");
    }
  };

  const duplicarModeloSelecionado = async () => {
    if (selectedModeloId) {
      try {
        const modelo = await EtiquetaCustomModel.getById(selectedModeloId);
        if (modelo) {
          // Criar uma cópia do modelo com um nome indicando que é uma cópia
          const modeloCopia: ModeloEtiqueta = {
            ...modelo,
            nome: `${modelo.nome} (Cópia)`,
            descricao: modelo.descricao ? `${modelo.descricao} (Cópia)` : "Cópia",
          };
          delete modeloCopia.id; // Remover o ID para criar um novo registro
          
          const novoModeloId = await EtiquetaCustomModel.create(modeloCopia);
          
          if (novoModeloId) {
            toast.success("Modelo duplicado com sucesso!");
            const modelos = await EtiquetaCustomModel.getAll();
            setModelosCustom(modelos);
          } else {
            toast.error("Erro ao duplicar modelo");
          }
        } else {
          toast.error("Erro ao carregar modelo para duplicação");
        }
      } catch (error) {
        console.error("Erro ao duplicar modelo:", error);
        toast.error("Erro ao duplicar modelo");
      }
    } else {
      toast.error("Nenhum modelo selecionado para duplicar");
    }
  };

  if (showModeloForm || modeloParaEditar) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{modeloParaEditar ? 'Editar Modelo de Etiqueta' : 'Criar Novo Modelo de Etiqueta'}</DialogTitle>
            <DialogDescription>
              {modeloParaEditar 
                ? 'Modifique as configurações do modelo de etiqueta existente.'
                : 'Preencha os campos abaixo para criar um novo modelo de etiqueta personalizada.'}
            </DialogDescription>
          </DialogHeader>
          <EtiquetaCustomForm
            modelo={modeloParaEditar ?? undefined}
            onClose={() => {
              setShowModeloForm(false);
              setModeloParaEditar(null);
            }}
            onSuccess={handleModeloSuccess}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Imprimir Etiquetas</DialogTitle>
          <DialogDescription>
            Configure as opções de impressão para gerar etiquetas para o item selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="label-model">Modelo da etiqueta</Label>
              <Select value={labelModel} disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Padrão">Padrão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="copies">Cópias</Label>
              <Input
                id="copies"
                type="number"
                min="1"
                value={copies}
                onChange={(e) => setCopies(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-row">Linha início</Label>
              <Input
                id="start-row"
                type="number"
                min="1"
                value={startRow}
                onChange={(e) => setStartRow(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-column">Coluna início</Label>
              <Input
                id="start-column"
                type="number"
                min="1"
                value={startColumn}
                onChange={(e) => setStartColumn(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="multiply-stock"
              checked={multiplyByStock}
              onCheckedChange={setMultiplyByStock}
            />
            <Label htmlFor="multiply-stock">Multiplicar por estoque</Label>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Modelo de Etiqueta</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setModeloParaEditar(null);
                setShowModeloForm(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Modelo
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modelos-custom">Modelos personalizados</Label>
              <Select 
                value={selectedModeloId} 
                onValueChange={setSelectedModeloId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelosCustom.length > 0 ? (
                    modelosCustom.map((modelo) => (
                      <SelectItem key={modelo.id} value={modelo.id || ""}>
                        {modelo.nome}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="sem-modelos" disabled>
                      Nenhum modelo disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedModeloId && (
              <div className="flex items-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <MoreVertical className="h-4 w-4" />
                      Opções
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={editarModeloSelecionado}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar Modelo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={duplicarModeloSelecionado}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <rect x="8" y="8" width="12" height="12" rx="2" />
                        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                      </svg>
                      Duplicar Modelo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          {selectedModelo && (
            <div className="border p-4 rounded-md bg-slate-50">
              <h4 className="font-medium mb-2">Detalhes do modelo: {selectedModelo.nome}</h4>
              <div className="text-sm space-y-1">
                <p>Dimensões da etiqueta: {selectedModelo.largura}mm × {selectedModelo.altura}mm</p>
                <p>Formato da página: {selectedModelo.formatoPagina} 
                  {selectedModelo.formatoPagina === "Personalizado" && selectedModelo.larguraPagina && selectedModelo.alturaPagina 
                    ? ` (${selectedModelo.larguraPagina}mm × ${selectedModelo.alturaPagina}mm)` 
                    : ""
                  }
                </p>
                <p>Orientação: {selectedModelo.orientacao === "retrato" ? "Retrato" : "Paisagem"}</p>
              </div>
            </div>
          )}
          
          {modeloWarning && (
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-700" />
              <AlertTitle className="text-yellow-800">Atenção</AlertTitle>
              <AlertDescription className="text-yellow-700">
                {modeloWarning}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handlePrint} disabled={isProcessing}>
            {isProcessing ? "Processando..." : "Imprimir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
