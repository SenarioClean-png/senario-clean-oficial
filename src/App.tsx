import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode, SyntheticEvent } from 'react';
import { Icon } from './components/Icons';
import { ServiceModal } from './components/ServiceModal';
import { SideCart } from './components/SideCart';
import { AdminPanel } from './components/AdminPanel';
import { AuthPanel } from './components/AuthPanel';
import { useDialog } from './components/useDialog';
import { asset, company as brand, mailtoUrl, whatsappUrl } from './config';
import type { CartItem, CatalogItem } from './data/catalog';
import { catalog, popularNames } from './data/catalog';
import { buildQuoteMessage, quoteSubject } from './lib/quote';
import { apiRequest, type AuthUser } from './lib/api';

const LOGO_SRC = asset('senario-mark.png');
const HOME_URL = import.meta.env.BASE_URL;
const initialCompany = { company: '', cnpj: '', contact: '', email: '', phone: '', zip: '' };
type CompanyField = keyof typeof initialCompany;
type StoreMode = 'home' | 'company';
type UtilityPanel = 'zip' | 'recurrence' | 'coupon' | 'send' | 'privacy' | 'terms' | null;
const enterprisePopularNames = ['Carpete', 'Cadeira', 'Sofá', 'Poltrona', 'Tapete', 'Automóvel', 'Puff', 'Colchão'];
const enterpriseNames = [...enterprisePopularNames, 'Almofada', 'Récamier', 'Cabeceira', 'Divã', 'Parede ou teto acarpetado', 'Protetor acolchoado', 'Banqueta', 'Bebê conforto', 'Box', 'Cama para pet', 'Canto alemão', 'Carrinho de bebê', 'Chaise', 'Futton', 'Longarina', 'Moisés', 'Namoradeira', 'Pillow Top', 'Travesseiro'];

const panelTitles: Record<Exclude<UtilityPanel, null>, string> = {
  zip: 'Informe seu CEP',
  recurrence: 'Recorrência',
  coupon: 'Cupom de desconto',
  send: 'Enviar pedido de orçamento',
  privacy: 'Política de privacidade',
  terms: 'Termos de uso',
};

type NoticeProps = { title: string; children: ReactNode; onClose: () => void };
function NoticeDialog({ title, children, onClose }: NoticeProps) {
  const titleId = useId();
  const ref = useDialog<HTMLElement>(onClose);
  return (
    <div className="modal-backdrop notice-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={ref} tabIndex={-1} className="notice-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="icon-button notice-close" aria-label="Fechar" onClick={onClose}><Icon name="close" /></button>
        <span className="notice-mark"><Icon name="sparkle" size={24} /></span>
        <h2 id={titleId}>{title}</h2>
        <div className="notice-content">{children}</div>
      </section>
    </div>
  );
}

function formatZip(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Aceita o CNPJ numérico e o alfanumérico (Receita Federal, a partir de jul/2026). */
function formatCnpj(value: string) {
  const c = value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 14);
  const parts = [c.slice(0, 2), c.slice(2, 5), c.slice(5, 8), c.slice(8, 12), c.slice(12, 14)];
  let out = parts[0];
  if (parts[1]) out += `.${parts[1]}`;
  if (parts[2]) out += `.${parts[2]}`;
  if (parts[3]) out += `/${parts[3]}`;
  if (parts[4]) out += `-${parts[4]}`;
  return out;
}

function isValidCnpj(value: string) {
  const c = value.toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || /^(.)\1+$/.test(c)) return false;
  const digit = (length: number) => {
    let weight = 2;
    let sum = 0;
    for (let i = length - 1; i >= 0; i -= 1) {
      sum += (c.charCodeAt(i) - 48) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return digit(12) === Number(c[12]) && digit(13) === Number(c[13]);
}

function onLogoError(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.visibility = 'hidden';
}

export default function App() {
  const [mode, setMode] = useState<StoreMode>('home');
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [businessPrompt, setBusinessPrompt] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CatalogItem | null>(null);
  // Casa e Empresa usam carrinhos separados, como informa o aviso de troca.
  const [carts, setCarts] = useState<Record<StoreMode, CartItem[]>>({ home: [], company: [] });
  const [zip, setZip] = useState('');
  const [zipMessage, setZipMessage] = useState('');
  const [utilityPanel, setUtilityPanel] = useState<UtilityPanel>(null);
  const [coupon, setCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [frequency, setFrequency] = useState('Semestral');
  const [draftFrequency, setDraftFrequency] = useState('Semestral');
  const [company, setCompany] = useState(initialCompany);
  const [agreement, setAgreement] = useState(false);
  const [companyNotice, setCompanyNotice] = useState('');
  const [toast, setToast] = useState('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [accountPanel, setAccountPanel] = useState(false);
  const [accountTab, setAccountTab] = useState<'login' | 'register'>('login');
  const [adminPanel, setAdminPanel] = useState(false);
  const [pendingSend, setPendingSend] = useState(false);
  const [recordingQuote, setRecordingQuote] = useState(false);
  const [scrollTarget, setScrollTarget] = useState<'categories' | 'cart' | null>(null);
  const toastTimer = useRef<number>();

  const cart = carts[mode];
  const setCart = (update: (current: CartItem[]) => CartItem[]) => setCarts((all) => ({ ...all, [mode]: update(all[mode]) }));

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  useEffect(() => {
    apiRequest<{ user: AuthUser | null }>('/api/auth/session')
      .then((result) => setCurrentUser(result.user))
      .catch(() => setCurrentUser(null));
  }, []);

  // A rolagem só acontece depois que o elemento de destino foi renderizado.
  useEffect(() => {
    if (!scrollTarget) return;
    const element = document.getElementById(scrollTarget);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (scrollTarget === 'cart') element.focus({ preventScroll: true });
    }
    setScrollTarget(null);
  }, [scrollTarget, showCompanyForm]);

  const popular = useMemo(() => {
    const names = mode === 'company' ? enterprisePopularNames : popularNames;
    return catalog.filter((item) => names.includes(item.name)).sort((a, b) => names.indexOf(a.name) - names.indexOf(b.name));
  }, [mode]);
  const other = useMemo(() => {
    const names = mode === 'company' ? enterprisePopularNames : popularNames;
    return catalog
      .filter((item) => !names.includes(item.name))
      .sort((a, b) => (mode === 'company' ? enterpriseNames.indexOf(a.name) - enterpriseNames.indexOf(b.name) : catalog.indexOf(a) - catalog.indexOf(b)));
  }, [mode]);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const showToast = (message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  };

  const goHome = () => {
    setMode('home');
    setShowCompanyForm(false);
  };
  const selectCompany = () => {
    if (mode === 'company') {
      setShowCompanyForm(false);
      return;
    }
    setBusinessPrompt(true);
  };
  const confirmCompany = () => {
    setBusinessPrompt(false);
    setMode('company');
    setShowCompanyForm(false);
    setCompanyNotice('');
  };
  const addToCart = (item: CartItem) => {
    setCart((current) => [...current, item]);
    setActiveCategory(null);
    showToast(`${item.category} adicionado ao carrinho.`);
  };
  const updateQuantity = (id: string, quantity: number) => {
    setCart((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };
  const removeItem = (id: string) => setCart((current) => current.filter((item) => item.id !== id));
  const changeZip = (value: string) => {
    setZip(formatZip(value));
    setZipMessage('');
  };
  const validateZip = () => {
    if (zip.replace(/\D/g, '').length !== 8) {
      setZipMessage('Digite um CEP com 8 números.');
      return false;
    }
    setZipMessage('CEP salvo. Ele vai junto no pedido para confirmarmos o atendimento na sua região.');
    return true;
  };
  const submitCompany = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidCnpj(company.cnpj)) {
      setCompanyNotice('CNPJ inválido. Confira os 14 caracteres e os dígitos verificadores.');
      return;
    }
    if (company.phone.replace(/\D/g, '').length < 10) {
      setCompanyNotice('Informe um telefone com DDD.');
      return;
    }
    if (company.zip.replace(/\D/g, '').length !== 8) {
      setCompanyNotice('Digite um CEP com 8 números.');
      return;
    }
    if (!agreement) {
      setCompanyNotice('É necessário aceitar a Política de privacidade e os Termos de uso para enviar seus dados.');
      return;
    }
    setCompanyNotice('');
    beginQuoteSend();
  };
  const updateCompany = (key: CompanyField, value: string) => {
    const formatted = key === 'zip' ? formatZip(value) : key === 'phone' ? formatPhone(value) : key === 'cnpj' ? formatCnpj(value) : value;
    setCompany((current) => ({ ...current, [key]: formatted }));
    setCompanyNotice('');
  };
  const openContinue = () => {
    if (!cart.length) return;
    if (mode === 'company') {
      setShowCompanyForm(true);
      return;
    }
    if (zip.replace(/\D/g, '').length !== 8) {
      setZipMessage('Informe o CEP do local de atendimento para continuar.');
      setUtilityPanel('zip');
      return;
    }
    beginQuoteSend();
  };

  const quoteMessage = buildQuoteMessage({
    mode,
    items: cart,
    zip,
    coupon,
    companyData: mode === 'company' && showCompanyForm ? company : undefined,
  });
  const recordQuote = async (user: AuthUser) => {
    if (recordingQuote) return;
    setRecordingQuote(true);
    try {
      await apiRequest('/api/quotes', {
        method: 'POST',
        body: JSON.stringify({ mode, items: cart, zip, coupon, company: mode === 'company' && showCompanyForm ? company : undefined, message: quoteMessage }),
      });
      setUtilityPanel('send');
      showToast(`Pedido registrado para ${user.phone}.`);
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Não foi possível registrar o pedido.');
    } finally {
      setRecordingQuote(false);
    }
  };
  const beginQuoteSend = () => {
    if (!currentUser) {
      setPendingSend(true);
      setAccountTab('login');
      setAccountPanel(true);
      return;
    }
    void recordQuote(currentUser);
  };
  useEffect(() => {
    if (currentUser && pendingSend) {
      setPendingSend(false);
      void recordQuote(currentUser);
    }
  }, [currentUser, pendingSend]);
  const addMore = () => {
    setShowCompanyForm(false);
    setScrollTarget('categories');
  };
  const openUtility = (panel: Exclude<UtilityPanel, null>) => {
    if (panel === 'recurrence') setDraftFrequency(frequency);
    setUtilityPanel(panel);
  };
  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setAccountPanel(false);
    showToast(user.role === 'admin' ? 'Conta de administrador conectada.' : 'Conta conectada com sucesso.');
  };
  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setAccountPanel(false);
      setAdminPanel(false);
      showToast('Você saiu da sua conta.');
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Não foi possível sair agora.');
    }
  };

  const renderCategories = (items: CatalogItem[], title: string, popularGrid: boolean) => (
    <section className="category-section" aria-label={title}>
      <h2 className="section-title">{title}</h2>
      <div className={`category-grid ${popularGrid ? 'popular-grid' : ''}`}>
        {items.map((item) => (
          <button type="button" className="category-card" key={item.id} onClick={() => setActiveCategory(item)} aria-label={`Configurar ${item.name}`}>
            <img src={asset(item.icon)} alt="" loading="lazy" width={48} height={50} />
            <span>{item.name}</span>
          </button>
        ))}
      </div>
    </section>
  );


  return (
    <div className="store-app">
      <header className="topbar">
        <a className="brand-mark" href={HOME_URL} aria-label={`${brand.name} — início`}>
          <img className="brand-logo" src={LOGO_SRC} alt="" aria-hidden="true" width={50} height={50} onError={onLogoError} />
          <span className="brand-copy">
            <span className="brand-name">{brand.name}</span>
            <span className="brand-tagline">{brand.tagline.toUpperCase()}</span>
          </span>
        </a>
        <nav className="header-actions" aria-label="Atalhos da loja">
          <button type="button" className="header-action" onClick={() => openUtility('zip')} aria-label="CEP"><Icon name="pin" /><span>CEP</span></button>
          <button type="button" className="header-action" onClick={() => openUtility('recurrence')} aria-label="Recorrência"><Icon name="repeat" /><span>Recorrência</span></button>
          <button type="button" className="header-action" onClick={() => openUtility('coupon')} aria-label="Cupom"><Icon name="ticket" /><span>Cupom</span></button>
          <button type="button" className="header-action account-action" onClick={() => setAccountPanel(true)} aria-label={currentUser ? 'Abrir minha conta' : 'Fazer login'}><span>{currentUser ? 'Minha conta' : 'Fazer login'}</span></button>
          <button type="button" className="header-cart" onClick={() => setScrollTarget('cart')} aria-label={`Abrir carrinho, ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}>
            <Icon name="cart" size={21} /><span className="cart-count" aria-hidden="true">{itemCount}</span>
          </button>
        </nav>
      </header>

      <div className="store-layout">
        <main className="store-content">
          <section className="welcome-banner" aria-label={`Apresentação ${brand.name}`}>
            <div className="loyalty-promo">
              <div className="loyalty-copy">
                <span className="loyalty-eyebrow">VANTAGEM PARA CLIENTES</span>
                <h2>Seu cuidado de sempre vale ainda mais.</h2>
                <p>A cada atendimento, ganhe um carimbo. Complete a cartela e ganhe um serviço!</p>
                <button type="button" className="loyalty-cta" onClick={addMore}>
                  Quero meu cartão fidelidade <Icon name="arrow" size={15} />
                </button>
              </div>
              <div className="loyalty-card" aria-label="Cartão fidelidade da Senário">
                <div className="loyalty-card-head">
                  <img className="loyalty-card-logo" src={LOGO_SRC} alt="" aria-hidden="true" width={42} height={42} onError={onLogoError} />
                  <span className="loyalty-card-brand"><strong>{brand.name}</strong><small>{brand.tagline}</small></span>
                  <span className="loyalty-card-spark" aria-hidden="true">✦</span>
                </div>
                <p className="loyalty-card-title">Seu próximo cuidado rende.</p>
                <div className="stamp-row" aria-label="Cinco espaços para carimbos">
                  {Array.from({ length: 5 }, (_, index) => <span className={`stamp-slot ${index === 4 ? 'stamp-slot-highlight' : ''}`} key={index}>{index === 4 ? '★' : '✦'}</span>)}
                </div>
                <div className="loyalty-card-bottom">
                  <span>Complete 5 atendimentos</span>
                  <strong>GANHE UM SERVIÇO</strong>
                </div>
              </div>
            </div>
          </section>

          <div className="content-heading">
            <h1>Selecione os itens que deseja limpar ou impermeabilizar:</h1>
            <div className="quick-actions">
              <button type="button" onClick={() => openUtility('zip')}><Icon name="pin" size={16} /> CEP</button>
              <button type="button" onClick={() => openUtility('recurrence')}><Icon name="repeat" size={16} /> Recorrência</button>
              <button type="button" onClick={() => openUtility('coupon')}><Icon name="ticket" size={16} /> Cupom</button>
            </div>
          </div>

          <div className="mode-switch" role="group" aria-label="Tipo de atendimento">
            <button type="button" aria-pressed={mode === 'home'} className={mode === 'home' ? 'active' : ''} onClick={goHome}>Para Casa</button>
            <button type="button" aria-pressed={mode === 'company'} className={mode === 'company' ? 'active' : ''} onClick={selectCompany}>Para Empresa</button>
          </div>

          {!showCompanyForm ? (
            <div id="categories" className="catalog-content">
              {renderCategories(popular, 'Mais agendados', true)}
              {renderCategories(other, 'Outros serviços', false)}
              {mode === 'company' && (
                <button type="button" className="enterprise-quote-button" onClick={() => setShowCompanyForm(true)}>
                  Solicitar orçamento para empresa <Icon name="arrow" size={16} />
                </button>
              )}
            </div>
          ) : (
            <section className="company-page" aria-labelledby="company-title">
              <button type="button" className="back-to-store" onClick={() => setShowCompanyForm(false)}>← Voltar para itens empresariais</button>
              <div className="company-intro">
                <span className="company-symbol"><Icon name="building" size={28} /></span>
                <p className="eyebrow">ATENDIMENTO CORPORATIVO</p>
                <h2 id="company-title">Bem-vindo à {brand.name} para empresas</h2>
                <p>Insira as informações da empresa para a qual deseja solicitar um orçamento.</p>
                {itemCount > 0 && <p className="company-cart-summary">{itemCount} {itemCount === 1 ? 'item selecionado' : 'itens selecionados'} no carrinho empresa.</p>}
              </div>
              <form className="company-form" onSubmit={submitCompany}>
                <label>Empresa<input required autoComplete="organization" value={company.company} onChange={(event) => updateCompany('company', event.target.value)} placeholder="Nome da empresa" /></label>
                <div className="form-two-col">
                  <label>CNPJ<input required autoCapitalize="characters" value={company.cnpj} onChange={(event) => updateCompany('cnpj', event.target.value)} placeholder="00.000.000/0000-00" /></label>
                  <label>Nome do responsável<input required autoComplete="name" value={company.contact} onChange={(event) => updateCompany('contact', event.target.value)} placeholder="Nome completo" /></label>
                </div>
                <div className="form-two-col">
                  <label>E-mail<input required type="email" autoComplete="email" value={company.email} onChange={(event) => updateCompany('email', event.target.value)} placeholder="nome@empresa.com.br" /></label>
                  <label>Telefone<input required type="tel" autoComplete="tel" value={company.phone} onChange={(event) => updateCompany('phone', event.target.value)} placeholder="(00) 00000-0000" /></label>
                </div>
                <label>CEP<input required inputMode="numeric" autoComplete="postal-code" value={company.zip} onChange={(event) => updateCompany('zip', event.target.value)} placeholder="00000-000" /></label>
                <div className="agreement-row">
                  <input id="company-agreement" type="checkbox" checked={agreement} onChange={(event) => { setAgreement(event.target.checked); setCompanyNotice(''); }} />
                  <span>
                    <label htmlFor="company-agreement">Li e aceito a</label>{' '}
                    <button type="button" className="text-link" onClick={() => openUtility('privacy')}>Política de privacidade</button> e os{' '}
                    <button type="button" className="text-link" onClick={() => openUtility('terms')}>Termos de uso</button>.
                  </span>
                </div>
                {companyNotice && <p className="company-notice error" role="alert">{companyNotice}</p>}
                <button type="submit" className="primary-button company-submit">Revisar e enviar pedido <Icon name="arrow" size={17} /></button>
              </form>
            </section>
          )}
        </main>

        <SideCart
          items={cart}
          mode={mode}
          zip={zip}
          zipMessage={zipMessage}
          onZipChange={changeZip}
          onZipSubmit={validateZip}
          onQuantityChange={updateQuantity}
          onRemove={removeItem}
          onAddMore={addMore}
          onContinue={openContinue}
        />
      </div>

      <a className="support-bubble" href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label={`Falar com ${brand.name} no WhatsApp`}><Icon name="whatsapp" size={24} /></a>
      {toast && <div className="toast-message" role="status">{toast}</div>}

      {activeCategory && <ServiceModal category={activeCategory} initialFrequency={frequency} onClose={() => setActiveCategory(null)} onAdd={addToCart} />}

      {businessPrompt && (
        <NoticeDialog title="Atendimento para empresas" onClose={() => setBusinessPrompt(false)}>
          <p>Ao clicar em confirmar você será levado à nossa loja para empresa e passará a usar outro carrinho de compras. Os itens do carrinho de casa ficam guardados para quando você voltar. Deseja continuar?</p>
          <div className="notice-actions">
            <button type="button" className="secondary-button" onClick={() => setBusinessPrompt(false)}>Cancelar</button>
            <button type="button" className="primary-button" onClick={confirmCompany}>Confirmar</button>
          </div>
        </NoticeDialog>
      )}

      {accountPanel && (
        <NoticeDialog title={currentUser ? 'Minha conta' : 'Conta Senário Clean'} onClose={() => setAccountPanel(false)}>
          {currentUser ? (
            <div className="account-summary">
              <span className="account-avatar">✓</span>
              <p>Você está conectado com o telefone <strong>{currentUser.phone}</strong>.</p>
              <p className="account-hint">Cada orçamento enviado por esta conta fica registrado no seu histórico de atendimento.</p>
              {currentUser.role === 'admin' && <button type="button" className="primary-button full-width" onClick={() => { setAccountPanel(false); setAdminPanel(true); }}>Abrir painel administrativo</button>}
              <button type="button" className="secondary-button full-width" onClick={() => void handleLogout()}>Sair da conta</button>
            </div>
          ) : (
            <AuthPanel tab={accountTab} onTabChange={setAccountTab} onSuccess={handleAuthSuccess} onClose={() => setAccountPanel(false)} />
          )}
        </NoticeDialog>
      )}

      {adminPanel && <NoticeDialog title="Painel administrativo" onClose={() => setAdminPanel(false)}><AdminPanel onClose={() => setAdminPanel(false)} /></NoticeDialog>}

      {utilityPanel && (
        <NoticeDialog title={panelTitles[utilityPanel]} onClose={() => setUtilityPanel(null)}>
          {utilityPanel === 'zip' && (
            <form className="utility-form" onSubmit={(event) => { event.preventDefault(); if (validateZip()) setUtilityPanel(null); }}>
              <p>Informe o CEP do local de atendimento para consultar a disponibilidade.</p>
              <label>CEP<input inputMode="numeric" autoComplete="postal-code" maxLength={9} value={zip} onChange={(event) => changeZip(event.target.value)} placeholder="00000-000" /></label>
              {zipMessage && <p className={`zip-message ${zipMessage.startsWith('CEP') ? 'success' : 'error'}`} role="status">{zipMessage}</p>}
              <button type="submit" className="primary-button full-width">Consultar CEP <Icon name="arrow" size={16} /></button>
            </form>
          )}
          {utilityPanel === 'recurrence' && (
            <div className="utility-form">
              <p>Escolha a frequência padrão dos serviços. Ela já vem selecionada ao configurar cada item e pode ser alterada individualmente.</p>
              <div className="choice-list vertical-options">
                {['Única vez', 'Semestral', 'Anual'].map((option) => (
                  <button key={option} type="button" className={`choice-pill ${draftFrequency === option ? 'selected' : ''}`} aria-pressed={draftFrequency === option} onClick={() => setDraftFrequency(option)}>{option}</button>
                ))}
              </div>
              <button type="button" className="primary-button full-width" onClick={() => { setFrequency(draftFrequency); setUtilityPanel(null); showToast(`Frequência padrão: ${draftFrequency}.`); }}>Salvar frequência</button>
            </div>
          )}
          {utilityPanel === 'coupon' && (
            <form className="utility-form" onSubmit={(event) => { event.preventDefault(); setCouponMessage(coupon.trim() ? 'Cupom anotado no seu pedido.' : 'Digite um código de cupom.'); }}>
              <p>Informe seu cupom. Ele vai junto no pedido e o desconto é confirmado pela nossa equipe no atendimento.</p>
              <label>Cupom<input value={coupon} onChange={(event) => { setCoupon(event.target.value.toUpperCase()); setCouponMessage(''); }} placeholder="Digite seu cupom" /></label>
              {couponMessage && <p className={`zip-message ${couponMessage.startsWith('Cupom') ? 'success' : 'error'}`} role="status">{couponMessage}</p>}
              <button type="submit" className="primary-button full-width">Salvar cupom</button>
            </form>
          )}
          {utilityPanel === 'send' && (
            <div className="utility-form">
              <p>Confira o resumo e escolha por onde enviar. Respondemos com o valor e as datas disponíveis.</p>
              <pre className="quote-preview" tabIndex={0} aria-label="Resumo do pedido">{quoteMessage.replace(/\*/g, '')}</pre>
              <a className="primary-button full-width" href={whatsappUrl(quoteMessage)} target="_blank" rel="noopener noreferrer" onClick={() => setUtilityPanel(null)}>
                <Icon name="whatsapp" size={17} /> Enviar pelo WhatsApp
              </a>
              <a className="secondary-button full-width" href={mailtoUrl(quoteSubject(mode), quoteMessage.replace(/\*/g, ''))} onClick={() => setUtilityPanel(null)}>
                <Icon name="email" size={17} /> Enviar por e-mail
              </a>
            </div>
          )}
          {utilityPanel === 'privacy' && (
            <div className="utility-form legal-text">
              <p>O cadastro e os pedidos ficam armazenados com proteção de acesso para identificar o cliente e acompanhar os orçamentos enviados.</p>
              <p>Seu telefone é usado para autenticação e atendimento. A senha é armazenada somente como hash seguro. Você pode pedir a correção ou exclusão dos seus dados a qualquer momento pelo e-mail <a href={`mailto:${brand.email}`}>{brand.email}</a>.</p>
              <button type="button" className="primary-button full-width" onClick={() => setUtilityPanel(null)}>Fechar</button>
            </div>
          )}
          {utilityPanel === 'terms' && (
            <div className="utility-form legal-text">
              <p>O envio do pedido pelo site é uma solicitação de orçamento, não uma contratação. Valores, descontos de recorrência e cupons são confirmados pela nossa equipe antes do agendamento.</p>
              <p>O cancelamento é gratuito até 24 horas antes do horário agendado.</p>
              <button type="button" className="primary-button full-width" onClick={() => setUtilityPanel(null)}>Fechar</button>
            </div>
          )}
        </NoticeDialog>
      )}

      <footer className="site-footer">
        <div className="footer-brand-block">
          <a className="footer-wordmark" href={HOME_URL}>
            <img src={LOGO_SRC} alt="" aria-hidden="true" width={42} height={42} onError={onLogoError} />
            <span>{brand.name}</span>
          </a>
          <p>{brand.description}</p>
        </div>
        <address className="footer-contacts" aria-label={`Contato ${brand.name}`}>
          <a href={`mailto:${brand.email}`}><Icon name="email" size={17} /><span>{brand.email}</span></a>
          <a href={`tel:+${brand.phoneDigits}`}><Icon name="phone" size={17} /><span>{brand.phoneDisplay}</span></a>
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={17} /><span>WhatsApp</span></a>
          <a href={brand.instagramUrl} target="_blank" rel="noopener noreferrer"><Icon name="instagram" size={17} /><span>Instagram</span></a>
        </address>
        <span className="footer-note">
          © {new Date().getFullYear()} {brand.name} ·{' '}
          <button type="button" className="text-link" onClick={() => openUtility('privacy')}>Privacidade</button> ·{' '}
          <button type="button" className="text-link" onClick={() => openUtility('terms')}>Termos</button>
        </span>
      </footer>
    </div>
  );
}
