
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "@/hooks/useInventoryForm";
import { InventoryCategory, Supplier } from "@/models/inventoryModel";
import { useEffect } from "react";

interface MainFieldsProps {
  form: UseFormReturn<FormValues>;
  categories: InventoryCategory[];
  suppliers: Supplier[];
}

export function MainFields({ form, categories, suppliers }: MainFieldsProps) {
  // Verificação adicional para garantir que os valores estão corretos após renderização
  useEffect(() => {
    const rawCost = form.getValues("raw_cost");
    const unitCost = form.getValues("unit_cost");
    
    console.log("[MainFields] Valores do formulário após renderização:", {
      raw_cost: rawCost,
      unit_cost: unitCost
    });
  }, [form]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="supplier_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fornecedor</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="quantity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quantidade</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="min_stock"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Estoque Mínimo</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="raw_cost"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preço do Bruto (R$)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                {...field}
                value={field.value || 0}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="unit_cost"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Custo Total (R$)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                {...field}
                value={field.value || 0}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preço de Venda (R$)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
