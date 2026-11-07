import type { CartItem } from '../data/catalog';
import { asset } from '../config';
import { Icon } from './Icons';

interface Props {
  items: CartItem[];
  mode: 'home' | 'company';
  zip: string;
  zipMessage: string;
  onZipChange: (value: string) => void;
  onZipSubmit: () => boolean;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
  onContinue: () => void;
}

export function SideCart({ items, mode, zip, zipMessage, onZipChange, onZipSubmit, onQuantityChange, onRemove, onAddMore, onContinue }: Props) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <aside id="cart" className="cart-panel" aria-label="Carrinho de compras" tabIndex={-1}>
      <div className="cart-panel-heading">
        <div><h2>{mode === 'company' ? 'Carrinho empresa' : 'Carrinho'}</h2><span>{count} {count === 1 ? 'item' : 'itens'}</span></div>
        <Icon name="cart" size={23} />
      </div>
      {items.length === 0 ? (
        <div className="empty-cart">
          <span className="empty-cart-icon"><Icon name="cart" size={24} /></span>
          <strong>Carrinho vazio</strong>
          <p>Selecione os itens que deseja limpar ou impermeabilizar.</p>
        </div>
      ) : (
        <div className="cart-items">
          {items.map((item) => (
            <article className="cart-item" key={item.id}>
              <div className="cart-item-top">
                <img src={asset(item.icon)} alt="" />
                <div className="cart-item-name"><strong>{item.category}</strong><small>{item.service}</small></div>
                <button type="button" className="icon-button remove-item" aria-label={`Remover ${item.category}`} onClick={() => onRemove(item.id)}><Icon name="trash" size={16} /></button>
              </div>
              <div className="cart-item-details">
                {item.details.filter((line) => !line.startsWith('Serviço:')).map((line) => <span key={line}>{line}</span>)}
                <span>Frequência: {item.frequency}</span>
              </div>
              <div className="cart-item-bottom">
                <div className="quantity-control small" role="group" aria-label={`Quantidade de ${item.category}`}>
                  <button type="button" aria-label={`Diminuir quantidade de ${item.category}`} disabled={item.quantity <= 1} onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}><Icon name="minus" size={14} /></button>
                  <output aria-live="polite">{item.quantity}</output>
                  <button type="button" aria-label={`Aumentar quantidade de ${item.category}`} disabled={item.quantity >= 99} onClick={() => onQuantityChange(item.id, Math.min(99, item.quantity + 1))}><Icon name="plus" size={14} /></button>
                </div>
                <span className="quote-price">Sob orçamento</span>
              </div>
            </article>
          ))}
          <div className="cart-total-row"><span>Total</span><strong>Sob orçamento</strong></div>
          <p className="cart-price-note">Você recebe o valor final pelo WhatsApp ou e-mail depois de enviar o pedido.</p>
        </div>
      )}

      <div className="cart-controls">
        <button type="button" className="add-more-button" onClick={onAddMore}>ADICIONAR ITENS</button>
        <label className="zip-label">
          <span><Icon name="pin" size={17} /> CEP</span>
          <div className="zip-input-row">
            <input inputMode="numeric" autoComplete="postal-code" maxLength={9} value={zip} placeholder="00000-000" onChange={(event) => onZipChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onZipSubmit(); }} aria-label="CEP" />
            <button type="button" className="zip-submit" onClick={() => onZipSubmit()} aria-label="Consultar CEP"><Icon name="arrow" size={16} /></button>
          </div>
        </label>
        {zipMessage && <p className={`zip-message ${zipMessage.startsWith('CEP') ? 'success' : 'error'}`} role="status">{zipMessage}</p>}
        <button type="button" className="primary-button continue-button" disabled={items.length === 0} onClick={onContinue}>Pedir orçamento <Icon name="arrow" size={16} /></button>
        <small className="demo-disclaimer">Você revisa o resumo antes de enviar.</small>
      </div>
    </aside>
  );
}
