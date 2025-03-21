// Função para formatar CPF (XXX.XXX.XXX-XX)
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para formatar CNPJ (XX.XXX.XXX/XXXX-XX)
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Função para formatar CPF ou CNPJ
export function formatCPFOrCNPJ(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return formatCPF(cleaned);
  } else {
    return formatCNPJ(cleaned);
  }
}

// Função para formatar telefone ((XX) XXXXX-XXXX)
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

// Função para formatar CEP (XXXXX-XXX)
export function formatZipCode(zipCode: string): string {
  const cleaned = zipCode.replace(/\D/g, '');
  if (cleaned.length !== 8) return zipCode;
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// Função para formatar data relativa
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return "ontem";
  if (diffDays <= 7) return `há ${diffDays} dias`;
  if (diffDays <= 30) return `há ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays <= 365) return `há ${Math.floor(diffDays / 30)} meses`;
  
  return new Intl.DateTimeFormat('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  }).format(date);
}
