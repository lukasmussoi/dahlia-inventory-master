
export type ResellerStatus = 'Ativa' | 'Inativa';

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Reseller {
  id: string;
  name: string;
  cpfCnpj: string;
  phone: string;
  email?: string;
  address?: Address;
  status: ResellerStatus;
  promoterId: string;
  promoterName?: string;
  commissionRate?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ResellerInput {
  name: string;
  cpfCnpj: string;
  phone: string;
  email?: string;
  address?: Address;
  status: ResellerStatus;
  promoterId: string;
  commissionRate?: number | string; // Permitir ambos os tipos para facilitar o tratamento no formulário
}
