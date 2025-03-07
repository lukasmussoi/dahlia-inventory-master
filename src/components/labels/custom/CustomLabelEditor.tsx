import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomLabel } from "@/models/labelModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LabelCanvas } from "./LabelCanvas";
import { Json } from "@/integrations/supabase/types";

interface CampoEtiqueta {
  type: string;
  text?: string;
  left: number;
  top: number;
  width: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill?: string;
  textAlign?: string;
  barcodeType?: string;
}

interface CustomLabelEditorProps {
  isOpen: boolean;
  onClose: () => void;
  label: CustomLabel | null;
  onSave: (label: Partial<CustomLabel>, isNew: boolean) => Promise<void>;
}

export function CustomLabelEditor({
  isOpen,
  onClose,
  label,
  onSave,
}: CustomLabelEditorProps) {
  const [formValues, setFormValues] = useState<Partial<CustomLabel>>({
    descricao: "",
    orientacao: "portrait",
    formato_pagina: "A4",
    tipo: "produto",
    campos: [],
    altura: 30,
    largura: 60,
    margem_superior: 10,
    margem_inferior: 10,
    margem_esquerda: 10,
    margem_direita: 10,
    espacamento_vertical: 2,
    espacamento_horizontal: 2,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (label) {
      setFormValues({
        ...label
      });
    }
  }, [label]);

  const handleInputChange = (field: keyof CustomLabel, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formValues.descricao) {
      alert("Por favor, insira uma descrição para a etiqueta.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formValues, !label);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCanvasUpdate = (campos: CampoEtiqueta[]) => {
    setFormValues((prev) => ({
      ...prev,
      campos: campos as unknown as Json,
    }));
  };

  const getLabelCampos = (): CampoEtiqueta[] => {
    if (!formValues.campos) return [];
    
    if (Array.isArray(formValues.campos)) {
      return formValues.campos as unknown as CampoEtiqueta[];
    }
    
    return [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {label ? "Editar Etiqueta" : "Nova Etiqueta"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="general">Informações Gerais</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensões e Margens</TabsTrigger>
            <TabsTrigger value="editor">Editor Visual</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição da Etiqueta</Label>
                <Input
                  id="descricao"
                  value={formValues.descricao || ""}
                  onChange={(e) =>
                    handleInputChange("descricao", e.target.value)
                  }
                  placeholder="Ex: Etiqueta de Produtos Padrão"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Etiqueta</Label>
                  <Select
                    value={formValues.tipo || "produto"}
                    onValueChange={(value) => handleInputChange("tipo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="produto">Produtos</SelectItem>
                      <SelectItem value="embalagem">Embalagem</SelectItem>
                      <SelectItem value="endereco">Endereço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orientacao">Orientação</Label>
                  <Select
                    value={formValues.orientacao || "portrait"}
                    onValueChange={(value) =>
                      handleInputChange("orientacao", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a orientação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Retrato</SelectItem>
                      <SelectItem value="landscape">Paisagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formato_pagina">Formato da Página</Label>
                <Select
                  value={formValues.formato_pagina || "A4"}
                  onValueChange={(value) =>
                    handleInputChange("formato_pagina", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
                    <SelectItem value="A5">A5 (148 x 210 mm)</SelectItem>
                    <SelectItem value="Letter">Carta (216 x 279 mm)</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formValues.formato_pagina === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="largura_pagina">
                      Largura da Página (mm)
                    </Label>
                    <Input
                      id="largura_pagina"
                      type="number"
                      value={formValues.largura_pagina || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "largura_pagina",
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="altura_pagina">
                      Altura da Página (mm)
                    </Label>
                    <Input
                      id="altura_pagina"
                      type="number"
                      value={formValues.altura_pagina || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "altura_pagina",
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dimensions" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="largura">Largura da Etiqueta (mm)</Label>
                <Input
                  id="largura"
                  type="number"
                  value={formValues.largura || ""}
                  onChange={(e) =>
                    handleInputChange("largura", parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altura">Altura da Etiqueta (mm)</Label>
                <Input
                  id="altura"
                  type="number"
                  value={formValues.altura || ""}
                  onChange={(e) =>
                    handleInputChange("altura", parseFloat(e.target.value))
                  }
                />
              </div>
            </div>

            <h3 className="text-lg font-medium mt-4">Margens (mm)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="margem_superior">Margem Superior</Label>
                <Input
                  id="margem_superior"
                  type="number"
                  value={formValues.margem_superior || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "margem_superior",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="margem_inferior">Margem Inferior</Label>
                <Input
                  id="margem_inferior"
                  type="number"
                  value={formValues.margem_inferior || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "margem_inferior",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="margem_esquerda">Margem Esquerda</Label>
                <Input
                  id="margem_esquerda"
                  type="number"
                  value={formValues.margem_esquerda || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "margem_esquerda",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="margem_direita">Margem Direita</Label>
                <Input
                  id="margem_direita"
                  type="number"
                  value={formValues.margem_direita || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "margem_direita",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            </div>

            <h3 className="text-lg font-medium mt-4">Espaçamento (mm)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="espacamento_horizontal">
                  Espaçamento Horizontal
                </Label>
                <Input
                  id="espacamento_horizontal"
                  type="number"
                  value={formValues.espacamento_horizontal || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "espacamento_horizontal",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="espacamento_vertical">
                  Espaçamento Vertical
                </Label>
                <Input
                  id="espacamento_vertical"
                  type="number"
                  value={formValues.espacamento_vertical || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "espacamento_vertical",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editor" className="pt-4">
            <LabelCanvas
              width={formValues.largura || 60}
              height={formValues.altura || 30}
              campos={getLabelCampos()}
              onUpdate={handleCanvasUpdate}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Etiqueta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
