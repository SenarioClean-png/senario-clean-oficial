import catalogData from './catalog.json';

export interface CatalogItem {
  id: string;
  name: string;
  /** Caminho relativo à pasta public/ (ex.: "icons/sofa.png"). */
  icon: string;
}

export const catalog: CatalogItem[] = catalogData;

export interface ProductField {
  label: string;
  kind: 'choice' | 'text' | 'number';
  options?: string[];
  placeholder?: string;
  unit?: string;
  helper?: string;
  required?: boolean;
  multiple?: boolean;
  /** Campos numéricos que só aceitam números inteiros (ex.: número de lugares). */
  integer?: boolean;
}

export interface ProductProfile {
  fields: ProductField[];
  serviceOptions?: string[];
  addOns?: string[];
}

export interface CartItem {
  id: string;
  category: string;
  icon: string;
  quantity: number;
  service: string;
  frequency: string;
  details: string[];
}

const seats = (max = 12): string[] => Array.from({ length: max - 1 }, (_, i) => String(i + 2));
const sizes = ['Solteiro', 'Viúvo', 'Casal', 'Queen', 'King', 'Super King', 'Cama Auxiliar', 'Berço'];
const upholstery = ['Tecido', 'Couro'];
const area = (label: string, helper?: string): ProductField => ({ label, kind: 'number', placeholder: '0,00', unit: 'm²', helper, required: true });
const choice = (label: string, options: string[], required = true): ProductField => ({ label, kind: 'choice', options, required });
const numberOf = (label: string): ProductField => ({ label, kind: 'number', placeholder: '1', required: true, integer: true });

export const popularNames = [
  'Sofá', 'Tapete', 'Poltrona', 'Cadeira', 'Colchão',
  'Automóvel', 'Puff', 'Bebê conforto', 'Carpete', 'Carrinho de bebê', 'Almofada',
];

export const productProfiles: Record<string, ProductProfile> = {
  'Sofá': {
    fields: [
      { ...choice('Número de pessoas sentadas', seats()), helper: 'Cada pessoa adulta sentada equivale a aproximadamente 60 cm.' },
      choice('Modelo', ['Sofá Retrátil', 'Sofá Comum', 'Sofá de Canto', 'Sofá com Chaise', 'Sofá-Cama']),
      choice('Material', upholstery),
    ],
    serviceOptions: ['Limpeza e Impermeabilização', 'Limpeza', 'Impermeabilização'],
    addOns: ['Limpeza Pet'],
  },
  'Tapete': {
    fields: [
      { label: 'Largura', kind: 'number', placeholder: '0,00', unit: 'm', required: true },
      { label: 'Comprimento', kind: 'number', placeholder: '0,00', unit: 'm', required: true },
      choice('Modelo', ['Comum']),
    ],
  },
  'Poltrona': { fields: [choice('Material', upholstery), choice('Modelo', ['Amamentação', 'Comum', 'Papai', 'Pé Palito', 'Almofadas Soltas'])] },
  'Cadeira': { fields: [choice('Modelo', ['Estofado no assento', 'Estofado no encosto', 'Estofado no assento e encosto', 'Luis XV, XIV ou XVI']), choice('Material', upholstery)] },
  'Colchão': {
    fields: [choice('Tamanho', sizes), choice('Opção', ['Box/Baú', 'Cabeceira'])],
    serviceOptions: ['Limpeza e Impermeabilização'],
    addOns: ['Limpeza Pet'],
  },
  'Automóvel': {
    fields: [
      choice('Tamanho', ['Pequeno', 'Médio', 'Grande', 'Extra Grande']),
      choice('Material', upholstery),
      choice('Opção', ['Banco', 'Interior completo', 'Alagamento']),
    ],
  },
  'Puff': { fields: [choice('Tamanho', ['Pequeno', 'Médio', 'Grande'])] },
  'Bebê conforto': { fields: [] },
  'Carpete': { fields: [area('Tamanho')] },
  'Carrinho de bebê': { fields: [choice('Modelo', ['Convencional', 'Duplo', 'Triplo', 'Quadruplo', 'Quíntuplo'])] },
  'Almofada': { fields: [choice('Tamanho', ['Pequena', 'Grande']), choice('Material', upholstery)] },
  'Banqueta': { fields: [] },
  'Box': { fields: [] },
  'Cabeceira': { fields: [] },
  'Cama para pet': { fields: [choice('Tamanho', ['Pequeno', 'Grande'])] },
  'Canto alemão': { fields: [choice('Número de pessoas sentadas', seats())] },
  'Chaise': { fields: [] },
  'Divã': { fields: [choice('Material', upholstery)] },
  'Futton': { fields: [choice('Tamanho', ['Solteiro', 'Casal'])] },
  'Longarina': {
    fields: [choice('Número de pessoas sentadas', seats(6))],
    serviceOptions: ['Limpeza e Impermeabilização'],
    addOns: ['Limpeza Pet'],
  },
  'Moisés': { fields: [] },
  'Namoradeira': { fields: [] },
  'Parede ou teto acarpetado': { fields: [area('Tamanho')] },
  'Pillow Top': { fields: [choice('Tamanho', sizes)] },
  'Protetor acolchoado': { fields: [] },
  'Récamier': { fields: [choice('Material', upholstery)] },
  'Travesseiro': { fields: [choice('Modelo', ['Comum', 'Nasa'])] },
};

export const frequencies = ['Única vez', 'Semestral', 'Anual'];
export const services = ['Limpeza e Impermeabilização', 'Limpeza', 'Impermeabilização'];
/** Serviço registrado quando a categoria não oferece escolha de serviço. */
export const defaultService = 'Limpeza';

export const frequencyBenefits: Record<string, string[]> = {
  'Única vez': [
    'Contratação avulsa, sem renovação automática',
    'Cancelamento gratuito até 24h do agendamento',
    'Profissionais 5 estrelas',
  ],
  'Semestral': [
    'Ganhe 15% de desconto',
    'Contratação e cobrança a cada 6 meses',
    'Recomendado para quem possui crianças, pets ou alergias',
    'Cancelamento gratuito até 24h do agendamento',
    'Profissionais 5 estrelas',
  ],
  'Anual': [
    'Ganhe desconto nos serviços recorrentes',
    'Contratação e cobrança a cada 12 meses',
    'Cancelamento gratuito até 24h do agendamento',
    'Profissionais 5 estrelas',
  ],
};

export function profileFor(name: string): ProductProfile {
  return productProfiles[name] ?? { fields: [] };
}
