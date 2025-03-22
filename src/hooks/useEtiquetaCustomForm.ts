
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
  align: z.enum(['left', 'center', 'right']).optional(),
});

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  largura: z.number().min(10, "Largura mínima de 10mm").max(210, "Largura máxima de 210mm"),
  altura: z.number().min(5, "Altura mínima de 5mm").max(297, "Altura máxima de 297mm"),
  formatoPagina: z.string(),
  orientacao: z.string(),
  margemSuperior: z.number().min(0, "Margem superior deve ser positiva").max(200, "Margem superior muito grande"),
  margemInferior: z.number().min(0, "Margem inferior deve ser positiva").max(200, "Margem inferior muito grande"),
  margemEsquerda: z.number().min(0, "Margem esquerda deve ser positiva").max(200, "Margem esquerda muito grande"),
  margemDireita: z.number().min(0, "Margem direita deve ser positiva").max(200, "Margem direita muito grande"),
  espacamentoHorizontal: z.number().min(0, "Espaçamento horizontal deve ser positivo").max(200, "Espaçamento horizontal muito grande"),
  espacamentoVertical: z.number().min(0, "Espaçamento vertical deve ser positivo").max(200, "Espaçamento vertical muito grande"),
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
  margemInternaEtiquetaSuperior: z.number().min(0, "Margem interna superior deve ser positiva").max(200, "Margem interna superior muito grande"),
  margemInternaEtiquetaInferior: z.number().min(0, "Margem interna inferior deve ser positiva").max(200, "Margem interna inferior muito grande"),
  margemInternaEtiquetaEsquerda: z.number().min(0, "Margem interna esquerda deve ser positiva").max(200, "Margem interna esquerda muito grande"),
  margemInternaEtiquetaDireita: z.number().min(0, "Margem interna direita deve ser positiva").max(200, "Margem interna direita muito grande"),
  campos: z.array(campoEtiquetaSchema),
}).refine((data) => {
  // Verificar se o formato é personalizado, largura e altura da página são obrigatórios
  if (data.formatoPagina === "Personalizado") {
    return !!data.larguraPagina && !!data.alturaPagina;
  }
  return true;
}, {
  message: "Dimensões da página são obrigatórias para formato personalizado",
  path: ["formatoPagina"],
});

export type FormValues = z.infer<typeof formSchema>;

// Define campos padrão com todos os valores obrigatórios
const defaultCampos: CampoEtiqueta[] = [
  { tipo: 'nome', x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7 },
  { tipo: 'codigo', x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8 },
  { tipo: 'preco', x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10 },
];

export function useEtiquetaCustomForm(modelo?: ModeloEtiqueta, onClose?: () => void, onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [pageAreaWarning, setPageAreaWarning] = useState<string | null>(null);

  // Certifique-se de que os campos do modelo, se fornecidos, estejam no formato correto
  const modeloCampos = modelo?.campos 
    ? modelo.campos.map(campo => ({
        tipo: campo.tipo,
        x: Number(campo.x),
        y: Number(campo.y),
        largura: Number(campo.largura),
        altura: Number(campo.altura),
        tamanhoFonte: Number(campo.tamanhoFonte),
        align: campo.align || 'left'
      }))
    : defaultCampos;

  // Verificar se há campos nulos ou undefined nos campos do modelo
  if (modeloCampos) {
    modeloCampos.forEach((campo, index) => {
      if (campo.x === null || campo.y === null || campo.largura === null || 
          campo.altura === null || campo.tamanhoFonte === null) {
        console.warn(`Campo ${index} tem valores nulos:`, campo);
        // Corrigir valores nulos com padrões
        if (campo.x === null) campo.x = 0;
        if (campo.y === null) campo.y = 0;
        if (campo.largura === null) campo.largura = 40;
        if (campo.altura === null) campo.altura = 10;
        if (campo.tamanhoFonte === null) campo.tamanhoFonte = 8;
      }
    });
  }

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
      margemInternaEtiquetaSuperior: modelo?.margemInternaEtiquetaSuperior || 0,
      margemInternaEtiquetaInferior: modelo?.margemInternaEtiquetaInferior || 0,
      margemInternaEtiquetaEsquerda: modelo?.margemInternaEtiquetaEsquerda || 0,
      margemInternaEtiquetaDireita: modelo?.margemInternaEtiquetaDireita || 0,
      campos: modeloCampos,
    },
    mode: "onChange",
  });

  // Observar alterações nos campos relevantes para validação em tempo real
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Verificar apenas quando os campos relacionados às dimensões mudarem
      if (['formatoPagina', 'largura', 'altura', 'larguraPagina', 'alturaPagina', 
           'margemEsquerda', 'margemDireita', 'margemSuperior', 'margemInferior'].includes(name as string)) {
        validarDimensoes();
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Função para validar dimensões e exibir avisos
  const validarDimensoes = () => {
    const values = form.getValues();
    
    // Se o formato for personalizado
    if (values.formatoPagina === "Personalizado") {
      if (!values.larguraPagina || !values.alturaPagina) {
        setPageAreaWarning("Dimensões da página são obrigatórias para formato personalizado");
        return;
      }
      
      const areaUtilLargura = values.larguraPagina - values.margemEsquerda - values.margemDireita;
      const areaUtilAltura = values.alturaPagina - values.margemSuperior - values.margemInferior;
      
      // Verificações mais detalhadas
      if (areaUtilLargura <= 0) {
        setPageAreaWarning(`As margens laterais (${values.margemEsquerda}mm + ${values.margemDireita}mm) excedem a largura da página (${values.larguraPagina}mm). Reduza as margens.`);
        return;
      }
      
      if (areaUtilAltura <= 0) {
        setPageAreaWarning(`As margens verticais (${values.margemSuperior}mm + ${values.margemInferior}mm) excedem a altura da página (${values.alturaPagina}mm). Reduza as margens.`);
        return;
      }
      
      if (values.largura > areaUtilLargura) {
        setPageAreaWarning(
          `A largura da etiqueta (${values.largura}mm) excede a área útil (${areaUtilLargura}mm). ` +
          `Reduza a largura da etiqueta ou aumente a largura da página.`
        );
        return;
      }
      
      if (values.altura > areaUtilAltura) {
        setPageAreaWarning(
          `A altura da etiqueta (${values.altura}mm) excede a área útil (${areaUtilAltura}mm). ` +
          `Reduza a altura da etiqueta ou aumente a altura da página.`
        );
        return;
      }
    } else {
      // Formatos predefinidos (A4, etc.)
      let larguraPagina = 210; // A4 padrão
      let alturaPagina = 297;
      
      // Definir dimensões com base no formato de página
      switch (values.formatoPagina) {
        case "A4":
          larguraPagina = 210;
          alturaPagina = 297;
          break;
        case "A5":
          larguraPagina = 148;
          alturaPagina = 210;
          break;
        case "Letter":
          larguraPagina = 216;
          alturaPagina = 279;
          break;
      }
      
      // Considerar orientação
      if (values.orientacao === "paisagem") {
        [larguraPagina, alturaPagina] = [alturaPagina, larguraPagina];
      }
      
      const areaUtilLargura = larguraPagina - values.margemEsquerda - values.margemDireita;
      const areaUtilAltura = alturaPagina - values.margemSuperior - values.margemInferior;
      
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
    
    // Se chegou aqui, não há problemas
    setPageAreaWarning(null);
  };

  async function onSubmit(data: FormValues) {
    try {
      // Validar novamente antes de salvar
      validarDimensoes();
      if (pageAreaWarning) {
        toast.error("Há problemas com as dimensões da etiqueta. Por favor, corrija antes de salvar.");
        return;
      }
      
      setIsLoading(true);
      console.log("Enviando dados do formulário:", data);

      // Garantir que todos os campos obrigatórios estejam preenchidos e com o tipo correto
      const camposValidados: CampoEtiqueta[] = data.campos.map(campo => ({
        tipo: campo.tipo,
        x: Number(campo.x),
        y: Number(campo.y),
        largura: Number(campo.largura),
        altura: Number(campo.altura),
        tamanhoFonte: Number(campo.tamanhoFonte),
        align: campo.align || 'left'
      }));

      // Garantir que todos os campos obrigatórios estejam preenchidos
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
        margemInternaEtiquetaSuperior: data.margemInternaEtiquetaSuperior,
        margemInternaEtiquetaInferior: data.margemInternaEtiquetaInferior,
        margemInternaEtiquetaEsquerda: data.margemInternaEtiquetaEsquerda,
        margemInternaEtiquetaDireita: data.margemInternaEtiquetaDireita,
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
    validarDimensoes
  };
}
