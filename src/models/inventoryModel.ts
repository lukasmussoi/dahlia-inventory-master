
// Adicionar este método à classe InventoryModel
static async getInventoryItemById(id: string): Promise<InventoryItem | null> {
  if (!id) throw new Error("ID do item é necessário");
  
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      inventory_categories (
        name
      ),
      suppliers (
        name
      )
    `)
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  
  if (!data) return null;
  
  return {
    ...data,
    category_name: data.inventory_categories?.name,
    supplier_name: data.suppliers?.name
  };
}
