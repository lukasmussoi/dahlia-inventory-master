
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generatePdfFromCustomLabel, generatePpla } from "@/utils/customLabelPdfUtils";
import { CustomLabel } from "@/models/labelModel";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export function LabelViewer() {
  const { id } = useParams<{ id: string }>();
  const [label, setLabel] = useState<CustomLabel | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados da etiqueta
  useEffect(() => {
    const fetchLabel = async () => {
      try {
        setLoading(true);
        if (!id) return;

        const { data, error } = await supabase
          .from("etiquetas_custom")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          throw error;
        }

        setLabel(data as CustomLabel);
        
        // Gerar PDF preview
        const url = await generatePdfFromCustomLabel(data as CustomLabel);
        setPdfUrl(url);
      } catch (error) {
        console.error("Erro ao carregar etiqueta:", error);
        toast.error("Erro ao carregar dados da etiqueta");
      } finally {
        setLoading(false);
      }
    };

    fetchLabel();

    // Cleanup
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [id]);

  // Manipulador para download do PDF
  const handleDownloadPdf = async () => {
    try {
      if (!label) return;

      // Se já temos a URL do PDF, usá-la; caso contrário, gerar novamente
      const url = pdfUrl || await generatePdfFromCustomLabel(label);
      
      // Criar link temporário para download
      const a = document.createElement("a");
      a.href = url;
      a.download = `etiqueta-${label.descricao.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  // Manipulador para impressão direta
  const handlePrint = async () => {
    try {
      if (!label) return;
      
      if (pdfUrl) {
        const printWindow = window.open(pdfUrl, "_blank");
        if (printWindow) {
          printWindow.addEventListener("load", () => {
            printWindow.print();
          });
        } else {
          toast.error("Seu navegador bloqueou a janela de impressão. Verifique as configurações.");
        }
      }
      
      toast.success("Documento enviado para impressão!");
    } catch (error) {
      console.error("Erro ao imprimir:", error);
      toast.error("Erro ao enviar para impressão");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!label) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Etiqueta não encontrada</CardTitle>
          <CardDescription>A etiqueta solicitada não existe ou foi removida.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link to="/dashboard/inventory/labels/custom">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Lista
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{label.descricao}</CardTitle>
            <CardDescription>
              Etiqueta de {label.largura}mm x {label.altura}mm ({label.formato_pagina}, {label.orientacao === 'portrait' ? 'Retrato' : 'Paisagem'})
            </CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link to="/dashboard/inventory/labels/custom">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="aspect-[2/3] border rounded-md overflow-hidden">
            {pdfUrl ? (
              <iframe 
                src={pdfUrl} 
                className="w-full h-full"
                title="Preview da etiqueta"
              />
            ) : (
              <div className="flex justify-center items-center h-full bg-muted">
                <p className="text-muted-foreground">Não foi possível gerar o preview</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Dimensões</h3>
              <p className="text-sm text-muted-foreground">
                Etiqueta: {label.largura}mm x {label.altura}mm<br />
                Folha: {label.formato_pagina === 'custom' ? `${label.largura_pagina}mm x ${label.altura_pagina}mm` : label.formato_pagina}<br />
                Margens: S:{label.margem_superior}mm, I:{label.margem_inferior}mm, E:{label.margem_esquerda}mm, D:{label.margem_direita}mm<br />
                Espaçamento: H:{label.espacamento_horizontal}mm, V:{label.espacamento_vertical}mm
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Elementos</h3>
              <p className="text-sm text-muted-foreground">
                Total de elementos: {label.campos?.length || 0}<br />
                Tipo de etiqueta: {label.tipo || "produto"}<br />
                Data de criação: {new Date(label.criado_em).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Etiqueta
        </Button>
        
        <Button onClick={handleDownloadPdf}>
          <Download className="h-4 w-4 mr-2" />
          Baixar PDF
        </Button>
      </CardFooter>
    </Card>
  );
}
