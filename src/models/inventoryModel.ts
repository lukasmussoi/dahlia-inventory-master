
import { supabase } from "@/integrations/supabase/client";

// Adicionar a função de busca de itens do inventário
static async searchInventoryItems(query: string) {
  try {
    let queryBuilder = supabase
      .from('inventory')
      .select(`
        *,
        categories:category_id (
          name
        ),
        suppliers:supplier_id (
          name
        )
      `);

    // Se houver uma consulta, faça uma busca por nome, código ou SKU
    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`
      );
    }

    // Apenas itens disponíveis
    queryBuilder = queryBuilder.eq('status', 'available');

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return data.map(item => ({
      ...item,
      category_name: item.categories?.name || null,
      supplier_name: item.suppliers?.name || null,
    }));
  } catch (error) {
    console.error("Erro ao buscar itens do inventário:", error);
    throw error;
  }
}

// Adicionar a função de atualização de status do item do inventário
static async updateInventoryItemStatus(id: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;

    return data[0];
  } catch (error) {
    console.error("Erro ao atualizar status do item:", error);
    throw error;
  }
}

