
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { LabelModel } from "@/models/labelModel";
import { generatePdfLabel } from "@/utils/pdfUtils";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import { EtiquetaCustomForm } from "./EtiquetaCustomForm";
import type { ModeloEtiqueta } from "@/types/etiqueta";
import { PrintLabelForm } from "./print/PrintLabelForm";
import { ModeloDetails } from "./print/ModeloDetails";
import { ModeloManager } from "./print/ModeloManager";

interface PrintLabelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // Tipo do item a ser impresso
}

export function PrintLabelDialog({
  isOpen,
  onClose,
  item
}: PrintLabelDialogProps) {
  // Estados para configuração de impressão
  const [copies, setCopies] = useState("1");
  const [startRow, setStartRow] = useState("1");
  const [startColumn, setStartColumn] = useState("1");
  const [multiplyByStock, setMultiplyByStock] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estados para gerenciamento de modelos
  const [showModeloForm, setShowModeloForm] = useState(false);
  const [modelosCustom, setModelosCustom] = useState<ModeloEtiqueta[]>([]);
  const [selectedModeloId, setSelectedModeloId] = useState<string | undefined>(undefined);
  const [selectedModelo, setSelectedModelo] = useState<ModeloEtiqueta | null>(null);
  const [modeloWarning, setModeloWarning] = useState<string | null>(null);
  const [etiquetaParaDuplicar, setEtiquetaParaDuplicar] = useState<ModeloEtiqueta | null>(null);

  // Carregar modelos personalizados
  useEffect(() => {
    const loadModelosCustom = async () => {
      try {
        console.log("Carregando modelos de etiquetas personalizadas...");
        const modelos = await EtiquetaCustomModel.getAll();
        console.log("Modelos carregados:", modelos);
        setModelosCustom(modelos);
        
        // Se houver modelos e nenhum modelo estiver selecionado, seleciona o primeiro
        if (modelos.length > 0 && !selectedModeloId) {
          setSelectedModeloId(modelos[0].id);
        }
      } catch (error) {
        console.error("Erro ao carregar modelos:", error);
        toast.error("Erro ao carregar modelos de etiquetas");
      }
    };
    if (isOpen) {
      loadModelosCustom();
    }
  }, [isOpen, selectedModeloId]);

  // Resetar formulário quando o diálogo é aberto
  useEffect(() => {
    if (isOpen) {
      setCopies("1");
      setStartRow("1");
      setStartColumn("1");
      setMultiplyByStock(false);
      setModeloWarning(null);
      setEtiquetaParaDuplicar(null);
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
            
            // Verificar dimensões do modelo
            if (modelo.formatoPagina === "Personalizado") {
              if (!modelo.larguraPagina || !modelo.alturaPagina) {
                setModeloWarning("Este modelo tem formato personalizado, mas as dimensões da página não estão definidas.");
                return;
              }

              // Verificar se a etiqueta cabe na página
              const areaUtilLargura = modelo.larguraPagina - modelo.margemEsquerda - modelo.margemDireita;
              if (modelo.largura > areaUtilLargura) {
                setModeloWarning(`A largura da etiqueta (${modelo.largura}mm) é maior que a área útil disponível (${areaUtilLargura}mm). ` + 
                  `Isso pode causar problemas na impressão. Considere editar o modelo.`);
                return;
              }
              const areaUtilAltura = modelo.alturaPagina - modelo.margemSuperior - modelo.margemInferior;
              if (modelo.altura > areaUtilAltura) {
                setModeloWarning(`A altura da etiqueta (${modelo.altura}mm) é maior que a área útil disponível (${areaUtilAltura}mm). ` + 
                  `Isso pode causar problemas na impressão. Considere editar o modelo.`);
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

  // Validação do formulário
  const validateInput = (): boolean => {
    if (!item) {
      toast.error("Nenhum item selecionado para impressão");
      return false;
    }
    
    if (!selectedModeloId) {
      toast.error("Selecione um modelo de etiqueta");
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

  // Função para imprimir
  const handlePrint = async () => {
    if (!validateInput()) return;
    try {
      setIsProcessing(true);
      console.log("Iniciando impressão com modelo:", selectedModeloId);
      
      if (!selectedModeloId) {
        throw new Error("Nenhum modelo de etiqueta selecionado");
      }

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

  // Função para adicionar novo modelo
  const handleModeloSuccess = async () => {
    setShowModeloForm(false);
    setEtiquetaParaDuplicar(null);
    try {
      const modelos = await EtiquetaCustomModel.getAll();
      setModelosCustom(modelos);
      toast.success("Modelo de etiqueta adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao recarregar modelos:", error);
    }
  };

  // Função para duplicar modelo
  const duplicarModelo = async () => {
    if (!selectedModelo) {
      toast.error("Selecione um modelo para duplicar");
      return;
    }

    try {
      // Criar cópia do modelo selecionado
      const modeloDuplicado = { ...selectedModelo };
      
      // Remover ID para criar um novo registro
      delete modeloDuplicado.id;
      
      // Adicionar indicação de que é uma cópia no nome
      modeloDuplicado.nome = `${modeloDuplicado.nome} (Cópia)`;
      
      // Abrir formulário com o modelo duplicado para edição
      setEtiquetaParaDuplicar(modeloDuplicado);
      setShowModeloForm(true);
    } catch (error) {
      console.error("Erro ao duplicar modelo:", error);
      toast.error("Erro ao duplicar modelo de etiqueta");
    }
  };

  // Renderizar o formulário de criação/edição de modelo
  if (showModeloForm) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
          </DialogHeader>
          <EtiquetaCustomForm 
            onClose={() => setShowModeloForm(false)} 
            onSuccess={handleModeloSuccess} 
            modelo={etiquetaParaDuplicar || undefined}
          />
        </DialogContent>
      </Dialog>;
  }

  // Renderizar o diálogo principal
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Imprimir Etiquetas</DialogTitle>
          <DialogDescription>
            Configure as opções de impressão para gerar etiquetas para o item selecionado.
          </DialogDescription>
        </DialogHeader>
        
        {/* Formulário de impressão */}
        <PrintLabelForm
          modelosCustom={modelosCustom}
          selectedModeloId={selectedModeloId}
          setSelectedModeloId={setSelectedModeloId}
          copies={copies}
          setCopies={setCopies}
          startRow={startRow}
          setStartRow={setStartRow}
          startColumn={startColumn}
          setStartColumn={setStartColumn}
          multiplyByStock={multiplyByStock}
          setMultiplyByStock={setMultiplyByStock}
          onPrint={handlePrint}
          onCancel={onClose}
          isProcessing={isProcessing}
          modeloWarning={modeloWarning}
        />
        
        <div className="space-y-4">
          {/* Gerenciador de modelos */}
          <ModeloManager
            selectedModelo={selectedModelo}
            onDuplicar={duplicarModelo}
            onNovo={() => setShowModeloForm(true)}
          />
          
          {/* Detalhes do modelo selecionado */}
          <ModeloDetails
            selectedModelo={selectedModelo}
            modeloWarning={modeloWarning}
          />
        </div>
      </DialogContent>
    </Dialog>;
}
