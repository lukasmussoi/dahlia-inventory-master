
export interface Promoter {
  id: string;
  name: string;
  cpfCnpj: string;
  phone: string;
  email?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  status: 'Ativa' | 'Inativa';
  createdAt: string;
  updatedAt?: string;
}

export interface PromoterInput {
  name: string;
  cpfCnpj: string;
  phone: string;
  email?: string;
  address?: {
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
