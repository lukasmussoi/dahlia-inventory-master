
export interface Promoter {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: 'Ativa' | 'Inativa';
  createdAt: string;
  updatedAt?: string;
}
