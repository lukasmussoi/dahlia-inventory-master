
export interface Promoter {
  id: string;
  name: string;
  cpfCnpj?: string; // Campo não existe no BD, opcional para compatibilidade
  phone?: string;
  email?: string;
  address?: string; // No BD é string, não objeto
  status?: 'Ativa' | 'Inativa'; // Mapeado do campo active do BD
  active?: boolean; // Campo real do BD
  commission_rate?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromoterInput {
  name: string;
  cpfCnpj?: string; // Campo não existe no BD, opcional para compatibilidade
  phone?: string;
  email?: string;
  address?: string | { // Aceita string ou objeto, será convertido para string
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  status: 'Ativa' | 'Inativa';
}
