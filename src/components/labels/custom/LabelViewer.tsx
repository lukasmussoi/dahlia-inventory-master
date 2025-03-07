
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LabelModel, CustomLabel } from "@/models/labelModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { generatePdfFromCustomLabel } from "@/utils/customLabelPdfUtils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function LabelViewer() {
  const { id } = useParams<{ id: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: label, isLoading } = useQuery({
    queryKey: ['custom-label', id],
    queryFn: () => id ? LabelModel.getCustomLabel(id) : Promise.reject('ID não fornecido'),
    enabled: !!id,
  });

  // Limpar URL do PDF ao desmontar o componente
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleGeneratePdf = async () => {
    if (!label) return;
    
    setIsGeneratingPdf(true);
    try {
      const url = await generatePdfFromCustomLabel(label);
      setPdfUrl(url);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!label) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg text-gray-500 mb-4">Etiqueta não encontrada</p>
            <Link to="/dashboard/inventory/labels/custom">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Lista de Etiquetas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/inventory/labels/custom">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{label.descricao}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Gerar PDF
              </>
            )}
          </Button>
          <Button disabled={!pdfUrl}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Informações da Etiqueta</h3>
              <dl className="grid grid-cols-2 gap-2">
                <dt className="text-sm font-medium text-gray-500">Tipo:</dt>
                <dd>{label.tipo}</dd>
                <dt className="text-sm font-medium text-gray-500">Orientação:</dt>
                <dd>{label.orientacao === "portrait" ? "Retrato" : "Paisagem"}</dd>
                <dt className="text-sm font-medium text-gray-500">Formato da Página:</dt>
                <dd>{label.formato_pagina}</dd>
                <dt className="text-sm font-medium text-gray-500">Dimensões:</dt>
                <dd>{label.largura}mm x {label.altura}mm</dd>
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Margens e Espaçamento</h3>
              <dl className="grid grid-cols-2 gap-2">
                <dt className="text-sm font-medium text-gray-500">Margem Superior:</dt>
                <dd>{label.margem_superior}mm</dd>
                <dt className="text-sm font-medium text-gray-500">Margem Inferior:</dt>
                <dd>{label.margem_inferior}mm</dd>
                <dt className="text-sm font-medium text-gray-500">Margem Esquerda:</dt>
                <dd>{label.margem_esquerda}mm</dd>
                <dt className="text-sm font-medium text-gray-500">Margem Direita:</dt>
                <dd>{label.margem_direita}mm</dd>
                <dt className="text-sm font-medium text-gray-500">Espaçamento Horizontal:</dt>
                <dd>{label.espacamento_horizontal}mm</dd>
                <dt className="text-sm font-medium text-gray-500">Espaçamento Vertical:</dt>
                <dd>{label.espacamento_vertical}mm</dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {pdfUrl && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Pré-visualização</h3>
            <div className="border rounded-lg overflow-hidden h-[600px]">
              <iframe 
                src={pdfUrl} 
                className="w-full h-full" 
                title="Pré-visualização da etiqueta" 
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
