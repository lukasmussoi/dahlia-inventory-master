import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import type { ModeloEtiqueta, CampoEtiqueta } from "@/types/etiqueta";

const campoEtiquetaSchema = z.object({
  tipo: z.enum(['nome', 'codigo', 'preco']),
  x: z.number().min(0, "Posição X deve ser maior ou igual a zero"),
  y: z.number().min(0, "Posição Y deve ser maior ou igual a zero"),
  largura: z.number().min(0, "Largura deve ser maior que zero"),
  altura: z.number().min(0, "Altura deve ser maior que zero"),
  tamanhoFonte: z.number().min(5, "Tamanho da fonte deve ser ao menos 5pt").max(24, "Tamanho da fonte não deve exceder 24pt"),
});

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  largura: z.number().min(10, "Largura mínima de 10mm").max(210, "Largura máxima de 210mm"),
  altura: z.number().min(5, "Altura mínima de 5mm").max(297, "Altura máxima de 297mm"),
  formatoPagina: z.string(),
  orientacao: z.enum(['retrato', 'paisagem']),
  margemSuperior: z.number().min(0, "Margem superior deve ser positiva").max(50, "Margem superior muito grande"),
  margemInferior: z.number().min(0, "Margem inferior deve ser positiva").max(50, "Margem inferior muito grande"),
  margemEsquerda: z.number().min(0, "Margem esquerda deve ser positiva").max(50, "Margem esquerda muito grande"),
  margemDireita: z.number().min(0, "Margem direita deve ser positiva").max(50, "Margem direita muito grande"),
  espacamentoHorizontal: z.number().min(0, "Espaçamento horizontal deve ser positivo").max(20, "Espaçamento horizontal muito grande"),
  espacamentoVertical: z.number().min(0, "Espaçamento vertical deve ser positivo").max(20, "Espaçamento vertical muito grande"),
  larguraPagina: z.number().optional().refine(value => !value || value >= 50, {
    message: "Largura da página deve ser pelo menos 50mm"
  }).refine(value => !value || value <= 300, {
    message: "Largura da página não deve exceder 300mm"
  }),
  alturaPagina: z.number().optional().refine(value => !value || value >= 50, {
    message: "Altura da página deve ser pelo menos 50mm"
  }).refine(value => !value || value <= 420, {
    message: "Altura da página não deve exceder 420mm"
  }),
  campos: z.array(campoEtiquetaSchema),
}).refine((data) => {
  if (data.formatoPagina === "Personalizado") {
    return !!data.larguraPagina && !!data.alturaPagina;
  }
  return true;
}, {
  message: "Dimensões da página são obrigatórias para formato personalizado",
  path: ["formatoPagina"],
});

export type FormValues = z.infer<typeof formSchema>;

const defaultCampos: CampoEtiqueta[] = [
  { tipo: 'nome', x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7 },
  { tipo: 'codigo', x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8 },
  { tipo: 'preco', x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10 },
];

export function useEtiquetaCustomForm(modelo?: ModeloEtiqueta, onClose?: () => void, onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [pageAreaWarning, setPageAreaWarning] = useState<string | null>(null);
  const [ajustarDimensoesAutomaticamente, setAjustarDimensoesAutomaticamente] = useState(false);

  const modeloCampos = modelo?.campos 
    ? modelo.campos.map(campo => ({
        tipo: campo.tipo,
        x: Number(campo.x),
        y: Number(campo.y),
        largura: Number(campo.largura),
        altura: Number(campo.altura),
        tamanhoFonte: Number(campo.tamanhoFonte)
      }))
    : defaultCampos;

  if (modeloCampos) {
    modeloCampos.forEach((campo, index) => {
      if (campo.x === null || campo.y === null || campo.largura === null || 
          campo.altura === null || campo.tamanhoFonte === null) {
        console.warn(`Campo ${index} tem valores nulos:`, campo);
        if (campo.x === null) campo.x = 0;
        if (campo.y === null) campo.y = 0;
        if (campo.largura === null) campo.largura = 40;
        if (campo.altura === null) campo.altura = 10;
        if (campo.tamanhoFonte === null) campo.tamanhoFonte = 8;
      }
    });
  }

  const orientacaoSegura = (modelo?.orientacao && 
      (modelo.orientacao === 'retrato' || modelo.orientacao === 'paisagem')) 
    ? modelo.orientacao 
    : 'retrato';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: modelo?.nome || "",
      descricao: modelo?.descricao || "",
      largura: modelo?.largura || 80,
      altura: modelo?.altura || 30,
      formatoPagina: modelo?.formatoPagina || "A4",
      orientacao: orientacaoSegura,
      margemSuperior: modelo?.margemSuperior || 10,
      margemInferior: modelo?.margemInferior || 10,
      margemEsquerda: modelo?.margemEsquerda || 10,
      margemDireita: modelo?.margemDireita || 10,
      espacamentoHorizontal: modelo?.espacamentoHorizontal || 0,
      espacamentoVertical: modelo?.espacamentoVertical || 0,
      larguraPagina: modelo?.larguraPagina || 210,
      alturaPagina: modelo?.alturaPagina || 297,
      campos: modeloCampos,
    },
    mode: "onChange",
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (['formatoPagina', 'largura', 'altura', 'larguraPagina', 'alturaPagina', 
           'margemEsquerda', 'margemDireita', 'margemSuperior', 'margemInferior'].includes(name as string)) {
        validarDimensoes();
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const validarDimensoes = () => {
    const values = form.getValues();
    
    if (values.formatoPagina === "Personalizado") {
      if (!values.larguraPagina || !values.alturaPagina) {
        setPageAreaWarning("Dimensões da página são obrigatórias para formato personalizado");
        return;
      }
      
      let larguraEfetiva = values.larguraPagina;
      let alturaEfetiva = values.alturaPagina;
      
      if (values.orientacao === "paisagem") {
        larguraEfetiva = values.alturaPagina;
        alturaEfetiva = values.larguraPagina;
      }
      
      const areaUtilLargura = larguraEfetiva - values.margemEsquerda - values.margemDireita;
      const areaUtilAltura = alturaEfetiva - values.margemSuperior - values.margemInferior;
      
      if (areaUtilLargura <= 0) {
        setPageAreaWarning(`As margens laterais (${values.margemEsquerda}mm + ${values.margemDireita}mm) excedem a largura efetiva da página (${larguraEfetiva}mm). Reduza as margens.`);
        return;
      }
      
      if (areaUtilAltura <= 0) {
        setPageAreaWarning(`As margens verticais (${values.margemSuperior}mm + ${values.margemInferior}mm) excedem a altura efetiva da página (${alturaEfetiva}mm). Reduza as margens.`);
        return;
      }
      
      if (values.largura > areaUtilLargura) {
        const sugestaoLarguraEtiqueta = Math.floor(areaUtilLargura * 0.9);
        
        setPageAreaWarning(
          `A largura da etiqueta (${values.largura}mm) excede a área útil (${areaUtilLargura}mm). ` +
          `Sugestão: Reduza a largura da etiqueta para ${sugestaoLarguraEtiqueta}mm ou ` +
          `aumente a largura da página para ${larguraEfetiva + values.largura - areaUtilLargura + 10}mm.`
        );
        return;
      }
      
      if (values.altura > areaUtilAltura) {
        const sugestaoAlturaEtiqueta = Math.floor(areaUtilAltura * 0.9);
        
        setPageAreaWarning(
          `A altura da etiqueta (${values.altura}mm) excede a área útil (${areaUtilAltura}mm). ` +
          `Sugestão: Reduza a altura da etiqueta para ${sugestaoAlturaEtiqueta}mm ou ` +
          `aumente a altura da página para ${alturaEfetiva + values.altura - areaUtilAltura + 10}mm.`
        );
        return;
      }
    } else {
      let larguraPagina = 210; // A4 padrão
      let alturaPagina = 297;
      
      switch (values.formatoPagina) {
        case "A4":
          larguraPagina = 210;
          alturaPagina = 297;
          break;
        case "A5":
          larguraPagina = 148;
          alturaPagina = 210;
          break;
        case "Carta":
          larguraPagina = 216;
          alturaPagina = 279;
          break;
      }
      
      let larguraEfetiva = larguraPagina;
      let alturaEfetiva = alturaPagina;
      
      if (values.orientacao === "paisagem") {
        larguraEfetiva = alturaPagina;
        alturaEfetiva = larguraPagina;
      }
      
      const areaUtilLargura = larguraEfetiva - values.margemEsquerda - values.margemDireita;
      const areaUtilAltura = alturaEfetiva - values.margemSuperior - values.margemInferior;
      
      if (values.largura > areaUtilLargura) {
        setPageAreaWarning(
          `A largura da etiqueta (${values.largura}mm) excede a área útil (${areaUtilLargura}mm) do formato ${values.formatoPagina}. ` +
          `Reduza a largura da etiqueta ou use um formato maior.`
        );
        return;
      }
      
      if (values.altura > areaUtilAltura) {
        setPageAreaWarning(
          `A altura da etiqueta (${values.altura}mm) excede a área útil (${areaUtilAltura}mm) do formato ${values.formatoPagina}. ` +
          `Reduza a altura da etiqueta ou use um formato maior.`
        );
        return;
      }
    }
    
    setPageAreaWarning(null);
  };

  const corrigirDimensoesAutomaticamente = () => {
    const values = form.getValues();
    
    if (values.formatoPagina === "Personalizado") {
      let larguraEfetiva = values.larguraPagina || 210;
      let alturaEfetiva = values.alturaPagina || 297;
      
      if (values.orientacao === "paisagem") {
        larguraEfetiva = values.alturaPagina || 297;
        alturaEfetiva = values.larguraPagina || 210;
      }
      
      const areaUtilLargura = larguraEfetiva - form.getValues("margemEsquerda") - form.getValues("margemDireita");
      const areaUtilAltura = alturaEfetiva - form.getValues("margemSuperior") - form.getValues("margemInferior");
      
      if (values.largura > areaUtilLargura) {
        const novaLargura = Math.floor(areaUtilLargura * 0.9);
        form.setValue("largura", novaLargura);
      }
      
      if (values.altura > areaUtilAltura) {
        const novaAltura = Math.floor(areaUtilAltura * 0.9);
        form.setValue("altura", novaAltura);
      }
      
      validarDimensoes();
      
      toast.success("Dimensões ajustadas automaticamente.");
    } else {
      let larguraPagina = 210; // A4 padrão
      let alturaPagina = 297;
      
      switch (values.formatoPagina) {
        case "A4":
          larguraPagina = 210;
          alturaPagina = 297;
          break;
        case "A5":
          larguraPagina = 148;
          alturaPagina = 210;
          break;
        case "Carta":
          larguraPagina = 216;
          alturaPagina = 279;
          break;
      }
      
      let larguraEfetiva = larguraPagina;
      let alturaEfetiva = alturaPagina;
      
      if (values.orientacao === "paisagem") {
        larguraEfetiva = alturaPagina;
        alturaEfetiva = larguraPagina;
      }
      
      const areaUtilLargura = larguraEfetiva - values.margemEsquerda - values.margemDireita;
      const areaUtilAltura = alturaEfetiva - values.margemSuperior - values.margemInferior;
      
      if (values.largura > areaUtilLargura) {
        form.setValue("largura", Math.floor(areaUtilLargura * 0.9));
      }
      
      if (values.altura > areaUtilAltura) {
        form.setValue("altura", Math.floor(areaUtilAltura * 0.9));
      }
      
      validarDimensoes();
      
      toast.success("Dimensões ajustadas automaticamente.");
    }
  };

  const toggleAjusteAutomatico = () => {
    setAjustarDimensoesAutomaticamente(prev => !prev);
    toast.info(ajustarDimensoesAutomaticamente ? 
      "Ajuste automático de dimensões desativado" : 
      "Ajuste automático de dimensões ativado");
  };

  async function onSubmit(data: FormValues) {
    try {
      validarDimensoes();
      if (pageAreaWarning && !ajustarDimensoesAutomaticamente) {
        toast.error("Há problemas com as dimensões da etiqueta. Por favor, corrija antes de salvar ou ative o ajuste automático.");
        return;
      }
      
      setIsLoading(true);
      console.log("Enviando dados do formulário:", data);

      const camposValidados: CampoEtiqueta[] = data.campos.map(campo => ({
        tipo: campo.tipo,
        x: Number(campo.x),
        y: Number(campo.y),
        largura: Number(campo.largura),
        altura: Number(campo.altura),
        tamanhoFonte: Number(campo.tamanhoFonte),
      }));

      const orientacao: 'retrato' | 'paisagem' = 
        data.orientacao === 'retrato' || data.orientacao === 'paisagem' 
          ? data.orientacao 
          : 'retrato';

      const modeloData: ModeloEtiqueta = {
        nome: data.nome,
        descricao: data.descricao,
        largura: data.largura,
        altura: data.altura,
        formatoPagina: data.formatoPagina,
        orientacao: orientacao,
        margemSuperior: data.margemSuperior,
        margemInferior: data.margemInferior,
        margemEsquerda: data.margemEsquerda,
        margemDireita: data.margemDireita,
        espacamentoHorizontal: data.espacamentoHorizontal,
        espacamentoVertical: data.espacamentoVertical,
        larguraPagina: data.larguraPagina,
        alturaPagina: data.alturaPagina,
        campos: camposValidados,
      };

      console.log("Salvando modelo:", modeloData);

      let success: boolean | string | null;
      if (modelo?.id) {
        success = await EtiquetaCustomModel.update(modelo.id, modeloData);
      } else {
        success = await EtiquetaCustomModel.create(modeloData);
      }

      if (success) {
        toast.success(modelo?.id ? "Modelo atualizado com sucesso!" : "Modelo criado com sucesso!");
        onSuccess?.();
        onClose?.();
      }
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      toast.error("Erro ao salvar modelo de etiqueta");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    form,
    isLoading,
    onSubmit,
    pageAreaWarning,
    corrigirDimensoesAutomaticamente,
    ajustarDimensoesAutomaticamente,
    toggleAjusteAutomatico
  };
}
