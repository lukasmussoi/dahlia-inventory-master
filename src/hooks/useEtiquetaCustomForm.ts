
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
  orientacao: z.string(),
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
}).refine((data) => {
  if (data.formatoPagina === "Personalizado" && data.larguraPagina && data.alturaPagina) {
    const areaUtilLargura = data.larguraPagina - data.margemEsquerda - data.margemDireita;
    return data.largura <= areaUtilLargura;
  }
  return true;
}, {
  message: "A largura da etiqueta excede a área útil da página. Reduza a largura da etiqueta ou aumente a largura da página.",
  path: ["largura"],
}).refine((data) => {
  if (data.formatoPagina === "Personalizado" && data.larguraPagina && data.alturaPagina) {
    const areaUtilAltura = data.alturaPagina - data.margemSuperior - data.margemInferior;
    return data.altura <= areaUtilAltura;
  }
  return true;
}, {
  message: "A altura da etiqueta excede a área útil da página. Reduza a altura da etiqueta ou aumente a altura da página.",
  path: ["altura"],
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

  const camposValidados: CampoEtiqueta[] = modeloCampos.map(campo => ({
    tipo: campo.tipo || 'nome',
    x: typeof campo.x === 'number' ? campo.x : 0,
    y: typeof campo.y === 'number' ? campo.y : 0,
    largura: typeof campo.largura === 'number' ? campo.largura : 40,
    altura: typeof campo.altura === 'number' ? campo.altura : 10,
    tamanhoFonte: typeof campo.tamanhoFonte === 'number' ? campo.tamanhoFonte : 8
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: modelo?.nome || "",
      descricao: modelo?.descricao || "",
      largura: modelo?.largura || 80,
      altura: modelo?.altura || 30,
      formatoPagina: modelo?.formatoPagina || "A4",
      orientacao: modelo?.orientacao || "retrato",
      margemSuperior: modelo?.margemSuperior || 10,
      margemInferior: modelo?.margemInferior || 10,
      margemEsquerda: modelo?.margemEsquerda || 10,
      margemDireita: modelo?.margemDireita || 10,
      espacamentoHorizontal: modelo?.espacamentoHorizontal || 0,
      espacamentoVertical: modelo?.espacamentoVertical || 0,
      larguraPagina: modelo?.larguraPagina || 210,
      alturaPagina: modelo?.alturaPagina || 297,
      campos: camposValidados,
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
      
      const areaUtilLargura = values.larguraPagina - values.margemEsquerda - values.margemDireita;
      const areaUtilAltura = values.alturaPagina - values.margemSuperior - values.margemInferior;
      
      if (values.largura > areaUtilLargura) {
        const sugestaoLarguraEtiqueta = Math.floor(areaUtilLargura * 0.9);
        const sugestaoLarguraPagina = Math.ceil(values.largura + values.margemEsquerda + values.margemDireita + 10);
        
        setPageAreaWarning(
          `A largura da etiqueta (${values.largura}mm) excede a área útil (${areaUtilLargura}mm). ` +
          `Sugestão: Reduza a largura da etiqueta para ${sugestaoLarguraEtiqueta}mm ou ` +
          `aumente a largura da página para ${sugestaoLarguraPagina}mm.`
        );
        return;
      }
      
      if (values.altura > areaUtilAltura) {
        const sugestaoAlturaEtiqueta = Math.floor(areaUtilAltura * 0.9);
        const sugestaoAlturaPagina = Math.ceil(values.altura + values.margemSuperior + values.margemInferior + 10);
        
        setPageAreaWarning(
          `A altura da etiqueta (${values.altura}mm) excede a área útil (${areaUtilAltura}mm). ` +
          `Sugestão: Reduza a altura da etiqueta para ${sugestaoAlturaEtiqueta}mm ou ` +
          `aumente a altura da página para ${sugestaoAlturaPagina}mm.`
        );
        return;
      }
    }
    
    setPageAreaWarning(null);
  };

  const corrigirDimensoesAutomaticamente = () => {
    const values = form.getValues();
    
    if (values.formatoPagina === "Personalizado") {
      if (!values.larguraPagina || !values.alturaPagina) {
        form.setValue("larguraPagina", 210);
        form.setValue("alturaPagina", 297);
      }
      
      const areaUtilLargura = values.larguraPagina - values.margemEsquerda - values.margemDireita;
      const areaUtilAltura = values.alturaPagina - values.margemSuperior - values.margemInferior;
      
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
    }
  };

  async function onSubmit(data: FormValues) {
    try {
      validarDimensoes();
      if (pageAreaWarning) {
        toast.error("Há problemas com as dimensões da etiqueta. Por favor, corrija antes de salvar.");
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

      const modeloData: ModeloEtiqueta = {
        nome: data.nome,
        descricao: data.descricao,
        largura: data.largura,
        altura: data.altura,
        formatoPagina: data.formatoPagina,
        orientacao: data.orientacao,
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
    corrigirDimensoesAutomaticamente
  };
}
