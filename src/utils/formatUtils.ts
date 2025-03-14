
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
