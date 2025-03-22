
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Monitor, Smartphone } from "lucide-react";

interface ConfigPanelProps {
  pageFormat: string;
  handleUpdatePageFormat: (value: string) => void;
  pageOrientation: string;
  handleUpdatePageOrientation: (value: string) => void;
  pageMargins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  handleUpdatePageMargin: (margin: 'top' | 'bottom' | 'left' | 'right', value: number) => void;
  labelSpacing: {
    horizontal: number;
    vertical: number;
  };
  handleUpdateLabelSpacing: (direction: 'horizontal' | 'vertical', value: number) => void;
  pageSize: {
    width: number;
    height: number;
  };
  setPageSize: (pageSize: {width: number, height: number}) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  autoAdjustDimensions?: boolean;
  onToggleAutoAdjust?: () => void;
}

export function ConfigPanel({
  pageFormat,
  handleUpdatePageFormat,
  pageOrientation,
  handleUpdatePageOrientation,
  pageMargins,
  handleUpdatePageMargin,
  labelSpacing,
  handleUpdateLabelSpacing,
  pageSize,
  setPageSize,
  gridSize,
  setGridSize,
  autoAdjustDimensions,
  onToggleAutoAdjust
}: ConfigPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-2">Configurações da Página</h3>
      
      <div>
        <Label className="text-xs mb-1 block">Formato da Página</Label>
        <Select
          value={pageFormat}
          onValueChange={handleUpdatePageFormat}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Selecione um formato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
            <SelectItem value="A5">A5 (148 × 210 mm)</SelectItem>
            <SelectItem value="Letter">Carta (216 × 279 mm)</SelectItem>
            <SelectItem value="Custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="text-xs mb-1 block">Orientação da Página</Label>
        <Select
          value={pageOrientation}
          onValueChange={handleUpdatePageOrientation}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Selecione a orientação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="retrato">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span>Retrato</span>
              </div>
            </SelectItem>
            <SelectItem value="paisagem">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span>Paisagem</span>
              </div>
            </SelectContent>
          </SelectTrigger>
        </Select>
      </div>
      
      {/* Margens da Página */}
      <div className="space-y-2">
        <Label className="text-xs mb-1 block">Margens da Página (mm)</Label>
        <div className="grid grid-cols-2 gap-x-2 gap-y-2">
          <div>
            <Label className="text-xs" htmlFor="margin-top">Margem Superior</Label>
            <Input
              id="margin-top"
              type="number"
              className="h-7 text-sm"
              value={pageMargins.top}
              onChange={(e) => handleUpdatePageMargin('top', Number(e.target.value))}
              min={0}
              max={200}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="margin-bottom">Margem Inferior</Label>
            <Input
              id="margin-bottom"
              type="number"
              className="h-7 text-sm"
              value={pageMargins.bottom}
              onChange={(e) => handleUpdatePageMargin('bottom', Number(e.target.value))}
              min={0}
              max={200}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="margin-left">Margem Esquerda</Label>
            <Input
              id="margin-left"
              type="number"
              className="h-7 text-sm"
              value={pageMargins.left}
              onChange={(e) => handleUpdatePageMargin('left', Number(e.target.value))}
              min={0}
              max={200}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="margin-right">Margem Direita</Label>
            <Input
              id="margin-right"
              type="number"
              className="h-7 text-sm"
              value={pageMargins.right}
              onChange={(e) => handleUpdatePageMargin('right', Number(e.target.value))}
              min={0}
              max={200}
            />
          </div>
        </div>
      </div>
      
      {/* Espaçamento entre Etiquetas */}
      <div className="space-y-2">
        <Label className="text-xs mb-1 block">Espaçamento entre Etiquetas (mm)</Label>
        <div className="grid grid-cols-2 gap-x-2 gap-y-2">
          <div>
            <Label className="text-xs" htmlFor="spacing-horizontal">Espaçamento Horizontal</Label>
            <Input
              id="spacing-horizontal"
              type="number"
              className="h-7 text-sm"
              value={labelSpacing.horizontal}
              onChange={(e) => handleUpdateLabelSpacing('horizontal', Number(e.target.value))}
              min={0}
              max={200}
            />
          </div>
          <div>
            <Label className="text-xs" htmlFor="spacing-vertical">Espaçamento Vertical</Label>
            <Input
              id="spacing-vertical"
              type="number"
              className="h-7 text-sm"
              value={labelSpacing.vertical}
              onChange={(e) => handleUpdateLabelSpacing('vertical', Number(e.target.value))}
              min={0}
              max={200}
            />
          </div>
        </div>
      </div>
      
      {pageFormat === "Custom" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs mb-1 block">Largura da Página (mm)</Label>
            <Input
              type="number"
              className="h-7 text-sm"
              value={pageSize.width}
              onChange={(e) => setPageSize({
                width: Number(e.target.value),
                height: pageSize.height
              })}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Altura da Página (mm)</Label>
            <Input
              type="number"
              className="h-7 text-sm"
              value={pageSize.height}
              onChange={(e) => setPageSize({
                width: pageSize.width,
                height: Number(e.target.value)
              })}
            />
          </div>
        </div>
      )}
      
      <div>
        <Label className="text-xs mb-1 block">Tamanho da Grade (mm)</Label>
        <Input
          type="number"
          className="h-7 text-sm"
          value={gridSize}
          onChange={(e) => setGridSize(Number(e.target.value))}
        />
      </div>
      
      {onToggleAutoAdjust && (
        <div className="flex items-center space-x-2 pt-2">
          <Switch 
            id="auto-adjust" 
            checked={autoAdjustDimensions}
            onCheckedChange={onToggleAutoAdjust}
          />
          <Label htmlFor="auto-adjust" className="text-sm cursor-pointer">
            Ajustar dimensões automaticamente
          </Label>
        </div>
      )}
    </div>
  );
}
