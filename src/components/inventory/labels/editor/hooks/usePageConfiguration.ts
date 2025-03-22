
import { useState, useEffect } from "react";

/**
 * Hook para gerenciar configurações de página e dimensões
 */
export function usePageConfiguration(initialData?: any) {
  console.log("Inicializando usePageConfiguration com dados:", initialData);
  
  // Configurações de página
  const [pageSize, setPageSize] = useState({ 
    width: initialData?.larguraPagina || 210, 
    height: initialData?.alturaPagina || 297 
  });
  const [pageFormat, setPageFormat] = useState(initialData?.formatoPagina || "A4");
  const [pageOrientation, setPageOrientation] = useState(initialData?.orientacao || "retrato");
  const [pageMargins, setPageMargins] = useState({
    top: initialData?.margemSuperior || 10,
    bottom: initialData?.margemInferior || 10,
    left: initialData?.margemEsquerda || 10,
    right: initialData?.margemDireita || 10
  });
  const [labelSpacing, setLabelSpacing] = useState({
    horizontal: initialData?.espacamentoHorizontal || 2,
    vertical: initialData?.espacamentoVertical || 2
  });
  
  // Log para debug
  useEffect(() => {
    console.log("Estado do usePageConfiguration atualizado:", {
      pageFormat,
      pageOrientation, 
      pageSize,
      pageMargins,
      labelSpacing
    });
  }, [pageFormat, pageOrientation, pageSize, pageMargins, labelSpacing]);
  
  /**
   * Atualiza a margem da página
   */
  const handleUpdatePageMargin = (margin: 'top' | 'bottom' | 'left' | 'right', value: number) => {
    // Limitar valor entre 0 e 200mm
    value = Math.max(0, Math.min(200, value));
    
    setPageMargins(prev => ({
      ...prev,
      [margin]: value
    }));
  };
  
  /**
   * Atualiza o espaçamento entre etiquetas
   */
  const handleUpdateLabelSpacing = (direction: 'horizontal' | 'vertical', value: number) => {
    // Limitar valor entre 0 e 200mm
    value = Math.max(0, Math.min(200, value));
    
    setLabelSpacing(prev => ({
      ...prev,
      [direction]: value
    }));
  };
  
  /**
   * Atualiza o formato da página e suas dimensões
   */
  const handleUpdatePageFormat = (value: string) => {
    console.log(`Alterando formato da página para: ${value}`);
    setPageFormat(value);
    
    // Define os tamanhos padrão com base no formato e orientação
    updatePageSizeBasedOnFormatAndOrientation(value, pageOrientation);
  };
  
  /**
   * Atualiza a orientação da página e suas dimensões
   */
  const handleUpdatePageOrientation = (value: string) => {
    console.log(`Alterando orientação da página para: ${value}`);
    setPageOrientation(value);
    
    // Atualiza as dimensões da página com base na nova orientação
    updatePageSizeBasedOnFormatAndOrientation(pageFormat, value);
  };
  
  /**
   * Atualiza as dimensões da página com base no formato e orientação
   */
  const updatePageSizeBasedOnFormatAndOrientation = (format: string, orientation: string) => {
    let width, height;
    
    // Definir dimensões padrão baseadas no formato
    if (format === "A4") {
      width = 210;
      height = 297;
    } else if (format === "A5") {
      width = 148;
      height = 210;
    } else if (format === "Letter") {
      width = 216;
      height = 279;
    } else if (format === "Personalizado" || format === "Custom") {
      // Para formato personalizado, usar os valores atuais ou iniciais
      width = initialData?.larguraPagina || pageSize.width || 210;
      height = initialData?.alturaPagina || pageSize.height || 297;
    } else {
      // Para outros formatos, usar os valores atuais
      width = pageSize.width;
      height = pageSize.height;
    }
    
    console.log(`Dimensões originais (${format}): ${width}x${height}`);
    
    // Inverter largura e altura se for paisagem
    if (orientation === "paisagem") {
      console.log(`Ajustando para paisagem: ${height}x${width}`);
      setPageSize({ width: height, height: width });
    } else {
      console.log(`Mantendo como retrato: ${width}x${height}`);
      setPageSize({ width, height });
    }
  };

  return {
    // Estado
    pageSize,
    setPageSize,
    pageFormat,
    pageOrientation,
    pageMargins,
    labelSpacing,
    
    // Funções
    handleUpdatePageMargin,
    handleUpdateLabelSpacing,
    handleUpdatePageFormat,
    handleUpdatePageOrientation
  };
}
