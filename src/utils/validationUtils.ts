
// Verifica se um CPF é válido
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validação simplificada - em uma aplicação real, seria mais completa
  return true;
}

// Verifica se um CNPJ é válido
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleaned.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validação simplificada - em uma aplicação real, seria mais completa
  return true;
}

// Verifica se um CPF ou CNPJ é válido
export function isValidCPFOrCNPJ(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return isValidCPF(cleaned);
  } else {
    return isValidCNPJ(cleaned);
  }
}

// Verifica se um telefone é válido
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

// Verifica se um email é válido
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Verifica se um CEP é válido
export function isValidZipCode(zipCode: string): boolean {
  const cleaned = zipCode.replace(/\D/g, '');
  return cleaned.length === 8;
}
