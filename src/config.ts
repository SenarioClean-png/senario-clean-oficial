/**
 * Dados da empresa usados em todo o site.
 * Para trocar telefone, e-mail ou redes sociais, edite apenas este arquivo.
 */
export const company = {
  name: 'Senário Clean',
  tagline: 'Limpeza de estofados',
  description: 'Limpeza e impermeabilização de estofados para casas e empresas.',
  email: 'clean.senario@gmail.com',
  /** Somente dígitos, com DDI e DDD (usado no link do WhatsApp e no tel:). */
  phoneDigits: '5511927533791',
  phoneDisplay: '+55 11 92753-3791',
  instagramUrl: 'https://www.instagram.com/senario.clean/',
  instagramHandle: '@senario.clean',
} as const;

export const whatsappUrl = (text?: string) =>
  `https://wa.me/${company.phoneDigits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const mailtoUrl = (subject: string, body: string) =>
  `mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** Caminho de arquivos da pasta public/, respeitando o "base" do Vite (ex.: GitHub Pages). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
