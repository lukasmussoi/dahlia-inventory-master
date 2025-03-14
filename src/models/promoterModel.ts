
import { supabase } from "@/integrations/supabase/client";
import { Promoter } from "@/types/promoter";

export class PromoterModel {
  static async getAll() {
    const { data, error } = await supabase
      .from('promoters')
      .select('*')
      .order('name');

    if (error) throw error;

    return data.map((promoter: any) => ({
      ...promoter,
      createdAt: promoter.created_at,
      updatedAt: promoter.updated_at,
    })) as Promoter[];
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('promoters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Promoter;
  }
}
