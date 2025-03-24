
/**
 * Modelo Base de Maletas
 * @file Funções base e utilitárias para o modelo de maletas
 */
import { supabase } from "@/integrations/supabase/client";

export class BaseSuitcaseModel {
  // Função auxiliar para processar o endereço que pode vir como string JSON
  static processSellerAddress(address: any): { 
    city?: string;
    neighborhood?: string;
    street?: string;
    number?: string;
    state?: string;
    zipCode?: string;
  } {
    let addressObj = {};

    if (!address) return addressObj;

    // Se for uma string, tentar converter para objeto
    if (typeof address === 'string') {
      try {
        addressObj = JSON.parse(address);
      } catch (e) {
        console.error("Erro ao processar endereço JSON:", e);
        return addressObj;
      }
    } else if (typeof address === 'object') {
      // Se já for um objeto, usar diretamente
      addressObj = address;
    }

    // Garantir que as propriedades existam
    return {
      city: addressObj?.['city'] || '',
      neighborhood: addressObj?.['neighborhood'] || '',
      street: addressObj?.['street'] || '',
      number: addressObj?.['number'] || '',
      state: addressObj?.['state'] || '',
      zipCode: addressObj?.['zipCode'] || ''
    };
  }

  // Gerar código único para maleta
  static async generateSuitcaseCode(): Promise<string> {
    const { count, error } = await supabase
      .from('suitcases')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    // Formato: ML001, ML002, etc.
    const nextNumber = (count || 0) + 1;
    return `ML${nextNumber.toString().padStart(3, '0')}`;
  }
}
