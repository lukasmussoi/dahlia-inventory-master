
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
      id: promoter.id,
      name: promoter.name,
      phone: promoter.phone,
      email: promoter.email,
      status: promoter.status,
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
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Promoter;
  }
}
