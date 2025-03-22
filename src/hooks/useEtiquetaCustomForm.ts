
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EtiquetaCustomModel } from "@/models/etiquetaCustomModel";
import type { ModeloEtiqueta, CampoEtiqueta } from "@/types/etiqueta";
import { validarDimensoesEtiqueta } from "@/lib/utils";

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
  largura: z.number().min(1, "Largura mínima de 1mm").max(300, "Largura máxima de 300mm"),
  altura: z.number().min(1, "Altura mínima de 1mm").max(300, "Altura máxima de 300mm"),
  formatoPagina: z.string(),
  orientacao: z.enum(['retrato', 'paisagem']),
  margemSuperior: z.number().min(0, "Margem superior deve ser positiva").max(200, "Margem superior muito grande"),
  margemInferior: z.number().min(0, "Margem inferior deve ser positiva").max(200, "Margem inferior muito grande"),
  margemEsquerda: z.number().min(0, "Margem esquerda deve ser positiva").max(200, "Margem esquerda muito grande"),
  margemDireita: z.number().min(0, "Margem direita deve ser positiva").max(200, "Margem direita muito grande"),
  espacamentoHorizontal: z.number().min(0, "Espaçamento horizontal deve ser positivo").max(200, "Espaçamento horizontal muito grande"),
  espacamentoVertical: z.number().min(0, "Espaçamento vertical deve ser positivo").max(200, "Espaçamento vertical muito grande"),
  larguraPagina: z.number().optional().refine(value => !value || value >= 10, {
    message: "Largura da página deve ser pelo menos 10mm"
  }).refine(value => !value || value <= 1000, {
    message: "Largura da página não deve exceder 1000mm"
  }),
  alturaPagina: z.number().optional().refine(value => !value || value >= 10, {
    message: "Altura da página deve ser pelo menos 10mm"
  }).refine(value => !value || value <= 1000, {
    message: "Altura da página não deve exceder 1000mm"
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

  // Usando margens de 0 por padrão para permitir maior área útil
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: modelo?.nome || "",
      descricao: modelo?.descricao || "",
      largura: modelo?.largura || 80,
      altura: modelo?.altura || 30,
      formatoPagina: modelo?.formatoPagina || "A4",
      orientacao: orientacaoSegura,
      margemSuperior: modelo?.margemSuperior !== undefined ? modelo.margemSuperior : 0,
      margemInferior: modelo?.margemInferior !== undefined ? modelo.margemInferior : 0,
      margemEsquerda: modelo?.margemEsquerda !== undefined ? modelo.margemEsquerda : 0,
      margemDireita: modelo?.margemDireita !== undefined ? modelo.margemDireita : 0,
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
      if (['formatoPagina', 'orientacao', 'largura', 'altura', 'larguraPagina', 'alturaPagina', 
           'margemEsquerda', 'margemDireita', 'margemSuperior', 'margemInferior'].includes(name as string)) {
        validarDimensoes();
      }
    });
    
    // Validar inicialmente
    validarDimensoes();
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const validarDimensoes = () => {
    const values = form.getValues();
    
    let larguraPagina: number;
    let alturaPagina: number;
    
    if (values.formatoPagina === "Personalizado") {
      if (!values.larguraPagina || !values.alturaPagina) {
        setPageAreaWarning("Dimensões da página são obrigatórias para formato personalizado");
        return;
      }
      
      larguraPagina = values.larguraPagina;
      alturaPagina = values.alturaPagina;
    } else {
      // Dimensões padrão para formatos conhecidos
      switch (values.formatoPagina) {
        case "A4":
          larguraPagina = 210;
          alturaPagina = 297;
          break;
        case "Letter":
          larguraPagina = 216;
          alturaPagina = 279;
          break;
        case "Legal":
          larguraPagina = 216;
          alturaPagina = 356;
          break;
        default:
          larguraPagina = 210;
          alturaPagina = 297;
      }
    }
    
    // Usar a função validarDimensoesEtiqueta do utils.ts para uma validação consistente
    const resultado = validarDimensoesEtiqueta(
      values.largura,
      values.altura,
      {
        largura: larguraPagina,
        altura: alturaPagina,
        margemSuperior: values.margemSuperior,
        margemInferior: values.margemInferior,
        margemEsquerda: values.margemEsquerda,
        margemDireita: values.margemDireita,
        orientacao: values.orientacao
      }
    );
    
    // Log para depuração
    console.log("Resultado da validação:", {
      resultado,
      etiqueta: {
        largura: values.largura,
        altura: values.altura
      },
      pagina: {
        largura: larguraPagina,
        altura: alturaPagina,
        orientacao: values.orientacao,
        margens: {
          superior: values.margemSuperior,
          inferior: values.margemInferior,
          esquerda: values.margemEsquerda,
          direita: values.margemDireita
        }
      }
    });
    
    if (!resultado.valido) {
      setPageAreaWarning(resultado.mensagem);
    } else {
      setPageAreaWarning(null);
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
    pageAreaWarning
  };
}
