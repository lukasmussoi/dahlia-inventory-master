
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
  larguraPagina: z.number().optional().refine(value => !value || value >= 20, {
    message: "Largura da página deve ser pelo menos 20mm"
  }).refine(value => !value || value <= 300, {
    message: "Largura da página não deve exceder 300mm"
  }),
  alturaPagina: z.number().optional().refine(value => !value || value >= 20, {
    message: "Altura da página deve ser pelo menos 20mm"
  }).refine(value => !value || value <= 420, {
    message: "Altura da página não deve exceder 420mm"
  }),
  campos: z.array(campoEtiquetaSchema),
}).refine((data) => {
  // Se o formato for personalizado, largura e altura da página são obrigatórios
  if (data.formatoPagina === "Personalizado") {
    return !!data.larguraPagina && !!data.alturaPagina;
  }
  return true;
}, {
  message: "Dimensões da página são obrigatórias para formato personalizado",
  path: ["formatoPagina"],
}).refine((data) => {
  // Verificar se as dimensões da etiqueta cabem na página
  if (data.formatoPagina === "Personalizado" && data.larguraPagina && data.alturaPagina) {
    const areaUtilLargura = data.larguraPagina - data.margemEsquerda - data.margemDireita;
    return data.largura <= areaUtilLargura;
  }
  return true;
}, {
  message: "A largura da etiqueta excede a área útil da página. Reduza a largura da etiqueta ou aumente a largura da página.",
  path: ["largura"],
}).refine((data) => {
  // Verificar se as dimensões da etiqueta cabem na página
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

// Define campos padrão com todos os valores obrigatórios
const defaultCampos: CampoEtiqueta[] = [
  { tipo: 'nome', x: 2, y: 4, largura: 40, altura: 10, tamanhoFonte: 7 },
  { tipo: 'codigo', x: 20, y: 1, largura: 40, altura: 6, tamanhoFonte: 8 },
  { tipo: 'preco', x: 70, y: 4, largura: 20, altura: 10, tamanhoFonte: 10 },
];

export function useEtiquetaCustomForm(modelo?: ModeloEtiqueta, onClose?: () => void, onSuccess?: () => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [pageAreaWarning, setPageAreaWarning] = useState<string | null>(null);
  const [etiquetaDefinida, setEtiquetaDefinida] = useState(!!modelo?.campos?.length);
  const [paginaDefinida, setPaginaDefinida] = useState(!!modelo?.formatoPagina);

  // Certifique-se de que os campos do modelo, se fornecidos, estejam no formato correto
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
      campos: modeloCampos,
    },
    mode: "onChange",
  });

  // Observar alterações nos campos relevantes para validação em tempo real
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Verificar se a página foi definida
      if (['formatoPagina', 'larguraPagina', 'alturaPagina', 
           'margemEsquerda', 'margemDireita', 'margemSuperior', 'margemInferior'].includes(name as string)) {
        const values = form.getValues();
        if (values.formatoPagina === "Personalizado") {
          setPaginaDefinida(!!values.larguraPagina && !!values.alturaPagina);
        } else {
          setPaginaDefinida(true);
        }
      }
      
      // Verificar apenas quando os campos relacionados às dimensões mudarem
      if (['formatoPagina', 'largura', 'altura', 'larguraPagina', 'alturaPagina', 
           'margemEsquerda', 'margemDireita', 'margemSuperior', 'margemInferior'].includes(name as string)) {
        validarDimensoes();
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Verificar quando alterações são feitas nos campos da etiqueta
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith('campos')) {
        const campos = form.getValues('campos');
        setEtiquetaDefinida(campos.length > 0);
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
    
    // Verificar formato A4 padrão
    else if (values.formatoPagina === "A4") {
      const larguraPaginaA4 = values.orientacao === "retrato" ? 210 : 297;
      const alturaPaginaA4 = values.orientacao === "retrato" ? 297 : 210;
      
      const areaUtilLargura = larguraPaginaA4 - values.margemEsquerda - values.margemDireita;
      const areaUtilAltura = alturaPaginaA4 - values.margemSuperior - values.margemInferior;
      
      if (values.largura > areaUtilLargura) {
        const sugestaoLarguraEtiqueta = Math.floor(areaUtilLargura * 0.9);
        
        setPageAreaWarning(
          `A largura da etiqueta (${values.largura}mm) excede a área útil (${areaUtilLargura}mm). ` +
          `Sugestão: Reduza a largura da etiqueta para ${sugestaoLarguraEtiqueta}mm.`
        );
        return;
      }
      
      if (values.altura > areaUtilAltura) {
        const sugestaoAlturaEtiqueta = Math.floor(areaUtilAltura * 0.9);
        
        setPageAreaWarning(
          `A altura da etiqueta (${values.altura}mm) excede a área útil (${areaUtilAltura}mm). ` +
          `Sugestão: Reduza a altura da etiqueta para ${sugestaoAlturaEtiqueta}mm.`
        );
        return;
      }
    }
    
    // Se chegou aqui, não há problemas
    setPageAreaWarning(null);
  };

  // Função para corrigir automaticamente as dimensões
  const corrigirDimensoesAutomaticamente = () => {
    const values = form.getValues();
    let larguraPagina = values.larguraPagina;
    let alturaPagina = values.alturaPagina;
    
    // Definir dimensões da página com base no formato selecionado
    if (values.formatoPagina === "A4") {
      larguraPagina = values.orientacao === "retrato" ? 210 : 297;
      alturaPagina = values.orientacao === "retrato" ? 297 : 210;
    } else if (values.formatoPagina === "A5") {
      larguraPagina = values.orientacao === "retrato" ? 148 : 210;
      alturaPagina = values.orientacao === "retrato" ? 210 : 148;
    } else if (values.formatoPagina === "Personalizado") {
      if (!larguraPagina || !alturaPagina) {
        // Definir dimensões padrão
        larguraPagina = 210;
        alturaPagina = 297;
        form.setValue("larguraPagina", larguraPagina);
        form.setValue("alturaPagina", alturaPagina);
      }
    }
    
    if (!larguraPagina || !alturaPagina) {
      toast.error("Não foi possível determinar as dimensões da página");
      return;
    }
    
    const areaUtilLargura = larguraPagina - values.margemEsquerda - values.margemDireita;
    const areaUtilAltura = alturaPagina - values.margemSuperior - values.margemInferior;
    
    // Corrigir largura da etiqueta se necessário
    if (values.largura > areaUtilLargura) {
      const novaLargura = Math.floor(areaUtilLargura * 0.9);
      form.setValue("largura", novaLargura);
    }
    
    // Corrigir altura da etiqueta se necessário
    if (values.altura > areaUtilAltura) {
      const novaAltura = Math.floor(areaUtilAltura * 0.9);
      form.setValue("altura", novaAltura);
    }
    
    // Recalcular depois das correções
    validarDimensoes();
    
    toast.success("Dimensões ajustadas automaticamente.");
  };

  // Otimizar layout para maximizar uso da página
  const otimizarLayout = () => {
    const values = form.getValues();
    let larguraPagina = values.larguraPagina;
    let alturaPagina = values.alturaPagina;
    
    // Definir dimensões da página com base no formato selecionado
    if (values.formatoPagina === "A4") {
      larguraPagina = values.orientacao === "retrato" ? 210 : 297;
      alturaPagina = values.orientacao === "retrato" ? 297 : 210;
    } else if (values.formatoPagina === "A5") {
      larguraPagina = values.orientacao === "retrato" ? 148 : 210;
      alturaPagina = values.orientacao === "retrato" ? 210 : 148;
    } else if (values.formatoPagina === "Personalizado") {
      if (!larguraPagina || !alturaPagina) {
        // Definir dimensões padrão se não forem fornecidas
        larguraPagina = 210;
        alturaPagina = 297;
        form.setValue("larguraPagina", larguraPagina);
        form.setValue("alturaPagina", alturaPagina);
      }
    }
    
    if (!larguraPagina || !alturaPagina) {
      toast.error("Não foi possível determinar as dimensões da página");
      return;
    }
    
    // Calcular área útil
    const areaUtilLargura = larguraPagina - values.margemEsquerda - values.margemDireita;
    const areaUtilAltura = alturaPagina - values.margemSuperior - values.margemInferior;
    
    // Calcular número ótimo de etiquetas na horizontal e vertical
    // Considerando algum espaçamento entre elas
    const espacamento = values.espacamentoHorizontal || 2;
    const espacamentoV = values.espacamentoVertical || 2;
    
    // Estimativa inicial: quantas etiquetas cabem na área útil
    // Começamos testando com 2 colunas e 2 linhas e vamos ajustando
    let numColunas = 2;
    let numLinhas = 2;
    
    // Calcular largura máxima baseada no número de colunas
    let larguraMaxima = Math.floor((areaUtilLargura - (espacamento * (numColunas - 1))) / numColunas);
    
    // Teste de várias configurações para encontrar a melhor
    const configuracoes = [];
    
    // Testar diferentes combinações de linhas e colunas
    for (let cols = 1; cols <= 10; cols++) {
      for (let rows = 1; rows <= 15; rows++) {
        const larguraEtiqueta = Math.floor((areaUtilLargura - (espacamento * (cols - 1))) / cols);
        const alturaEtiqueta = Math.floor((areaUtilAltura - (espacamentoV * (rows - 1))) / rows);
        
        // Verificar se a etiqueta tem dimensões mínimas aceitáveis
        if (larguraEtiqueta >= 10 && alturaEtiqueta >= 5) {
          configuracoes.push({
            colunas: cols,
            linhas: rows,
            largura: larguraEtiqueta,
            altura: alturaEtiqueta,
            area: larguraEtiqueta * alturaEtiqueta,
            total: cols * rows
          });
        }
      }
    }
    
    // Ordenar por total de etiquetas (decrescente) e depois por área (decrescente)
    configuracoes.sort((a, b) => {
      if (a.total !== b.total) return b.total - a.total;
      return b.area - a.area;
    });
    
    if (configuracoes.length === 0) {
      toast.error("Não foi possível encontrar um layout ótimo para as dimensões e margens fornecidas");
      return;
    }
    
    // Usar a melhor configuração encontrada
    const melhorConfig = configuracoes[0];
    
    // Atualizar dimensões da etiqueta
    form.setValue("largura", melhorConfig.largura);
    form.setValue("altura", melhorConfig.altura);
    
    // Atualizar espaçamento
    form.setValue("espacamentoHorizontal", espacamento);
    form.setValue("espacamentoVertical", espacamentoV);
    
    // Recalcular a posição dos campos na etiqueta
    const campos = form.getValues("campos");
    
    // Fator de escala em relação à etiqueta original
    const fatorEscalaLargura = melhorConfig.largura / values.largura;
    const fatorEscalaAltura = melhorConfig.altura / values.altura;
    
    // Ajustar a posição e tamanho de cada campo proporcionalmente
    const camposAjustados = campos.map(campo => ({
      ...campo,
      x: Math.round(campo.x * fatorEscalaLargura),
      y: Math.round(campo.y * fatorEscalaAltura),
      largura: Math.round(campo.largura * fatorEscalaLargura),
      altura: Math.round(campo.altura * fatorEscalaAltura)
    }));
    
    form.setValue("campos", camposAjustados);
    
    // Limpar avisos após otimização
    setPageAreaWarning(null);
    
    toast.success(
      `Layout otimizado! ${melhorConfig.total} etiquetas (${melhorConfig.colunas}x${melhorConfig.linhas}) ` +
      `com dimensões ${melhorConfig.largura}mm x ${melhorConfig.altura}mm.`
    );
  };

  // Duplicar o modelo atual (criar uma cópia com nome diferente)
  const duplicarModelo = async () => {
    if (!modelo) return;
    
    try {
      setIsLoading(true);
      const data = form.getValues();
      
      // Criar uma cópia do modelo com um nome indicando que é uma cópia
      const modeloCopia: ModeloEtiqueta = {
        nome: `${data.nome} (Cópia)`,
        descricao: `${data.descricao} (Cópia)`,
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
        campos: data.campos.map(campo => ({
          tipo: campo.tipo,
          x: Number(campo.x),
          y: Number(campo.y),
          largura: Number(campo.largura),
          altura: Number(campo.altura),
          tamanhoFonte: Number(campo.tamanhoFonte),
        })),
      };
      
      const novoModeloId = await EtiquetaCustomModel.create(modeloCopia);
      
      if (novoModeloId) {
        toast.success("Modelo duplicado com sucesso!");
        onSuccess?.();
      } else {
        toast.error("Erro ao duplicar modelo");
      }
    } catch (error) {
      console.error("Erro ao duplicar modelo:", error);
      toast.error("Erro ao duplicar modelo de etiqueta");
    } finally {
      setIsLoading(false);
    }
  };

  async function onSubmit(data: FormValues) {
    try {
      // Validar novamente antes de salvar
      validarDimensoes();
      if (pageAreaWarning) {
        // Em vez de mostrar erro, vamos corrigir automaticamente
        corrigirDimensoesAutomaticamente();
        // Obter os valores atualizados após a correção
        data = form.getValues();
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
    etiquetaDefinida,
    paginaDefinida,
    corrigirDimensoesAutomaticamente,
    duplicarModelo,
    otimizarLayout
  };
}
