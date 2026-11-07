import type { CartItem } from '../data/catalog';

export interface QuoteContext {
  mode: 'home' | 'company';
  items: CartItem[];
  zip: string;
  coupon?: string;
  companyData?: {
    company: string;
    cnpj: string;
    contact: string;
    email: string;
    phone: string;
    zip: string;
  };
}

/** Monta o texto do pedido de orçamento enviado por WhatsApp ou e-mail. */
export function buildQuoteMessage({ mode, items, zip, coupon, companyData }: QuoteContext) {
  const lines: string[] = [];
  lines.push(mode === 'company' ? 'Olá! Gostaria de um orçamento para a minha empresa.' : 'Olá! Gostaria de um orçamento.');
  lines.push('');

  if (companyData) {
    lines.push('*Dados da empresa*');
    lines.push(`Empresa: ${companyData.company}`);
    lines.push(`CNPJ: ${companyData.cnpj}`);
    lines.push(`Responsável: ${companyData.contact}`);
    lines.push(`E-mail: ${companyData.email}`);
    lines.push(`Telefone: ${companyData.phone}`);
    lines.push('');
  }

  if (items.length) {
    lines.push('*Itens*');
    items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.category} — quantidade: ${item.quantity}`);
      item.details.forEach((detail) => lines.push(`   • ${detail}`));
      lines.push(`   • Frequência: ${item.frequency}`);
    });
    lines.push('');
  }

  const cep = companyData?.zip || zip;
  if (cep) lines.push(`CEP do atendimento: ${cep}`);
  if (coupon?.trim()) lines.push(`Cupom: ${coupon.trim()}`);
  return lines.join('\n').trim();
}

export const quoteSubject = (mode: 'home' | 'company') =>
  mode === 'company' ? 'Pedido de orçamento — empresa' : 'Pedido de orçamento';
