
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ModeloEtiqueta } from "@/types/etiqueta";

interface PrintLabelFormProps {
  modelosCustom: ModeloEtiqueta[];
  selectedModeloId: string | undefined;
  setSelectedModeloId: (id: string | undefined) => void;
  copies: string;
  setCopies: (copies: string) => void;
  multiplyByStock: boolean;
  setMultiplyByStock: (multiply: boolean) => void;
  onPrint: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  modeloWarning: string | null;
}

export function PrintLabelForm({
  modelosCustom,
  selectedModeloId,
  setSelectedModeloId,
  copies,
  setCopies,
  multiplyByStock,
  setMultiplyByStock,
  onPrint,
  onCancel,
  isProcessing,
  modeloWarning
}: PrintLabelFormProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="label-model">Modelo de Etiqueta</Label>
          <Select value={selectedModeloId} onValueChange={setSelectedModeloId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um modelo" />
            </SelectTrigger>
            <SelectContent>
              {modelosCustom.length > 0 ? modelosCustom.map(modelo => (
                <SelectItem key={modelo.id} value={modelo.id || ""}>
                  {modelo.nome}
                </SelectItem>
              )) : (
                <SelectItem value="sem-modelos" disabled>
                  Nenhum modelo disponível
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="copies">Cópias</Label>
          <Input 
            id="copies" 
            type="number" 
            min="1" 
            value={copies} 
            onChange={e => setCopies(e.target.value)} 
            disabled={multiplyByStock} 
            className={multiplyByStock ? "bg-gray-100 text-gray-500" : ""}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch id="multiply-stock" checked={multiplyByStock} onCheckedChange={setMultiplyByStock} />
        <Label htmlFor="multiply-stock">Multiplicar por estoque</Label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancelar
        </Button>
        <Button onClick={onPrint} disabled={isProcessing || !selectedModeloId}>
          {isProcessing ? "Processando..." : "Imprimir"}
        </Button>
      </div>
    </div>
  );
}
