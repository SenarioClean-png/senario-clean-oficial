import { useMemo, useState } from 'react';
import type { CartItem, CatalogItem, ProductField } from '../data/catalog';
import { defaultService, frequencies, frequencyBenefits, profileFor } from '../data/catalog';
import { asset } from '../config';
import { Icon } from './Icons';
import { useDialog } from './useDialog';

interface Props {
  category: CatalogItem;
  initialFrequency: string;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}

function formatDetails(fields: ProductField[], values: Record<string, string>, service: string, extra: string | null) {
  return [
    ...fields
      .filter((field) => (values[field.label] ?? '').trim() !== '')
      .map((field) => `${field.label}: ${values[field.label]}${field.unit ? ` ${field.unit}` : ''}`),
    `Serviço: ${service}`,
    ...(extra ? [`Serviço adicional: ${extra}`] : []),
  ];
}

/** Mantém só dígitos (inteiros) ou dígitos com um separador decimal (vírgula). */
function sanitizeNumber(raw: string, integer: boolean) {
  if (integer) return raw.replace(/\D/g, '').slice(0, 4);
  const normalized = raw.replace(/\./g, ',').replace(/[^\d,]/g, '');
  const [whole, ...rest] = normalized.split(',');
  const decimals = rest.join('').slice(0, 2);
  return rest.length ? `${whole.slice(0, 5)},${decimals}` : whole.slice(0, 5);
}

function parseNumber(value: string) {
  return Number(value.replace(',', '.'));
}

function FieldControl({ field, value, onChange }: { field: ProductField; value: string; onChange: (value: string) => void }) {
  if (field.kind === 'choice') {
    return (
      <fieldset className="option-field">
        <legend>{field.label}{field.required === false ? <span className="optional-tag"> (opcional)</span> : null}</legend>
        {field.helper && <p className="field-helper">{field.helper}</p>}
        <div className="choice-list">
          {(field.options ?? []).map((option) => (
            <button
              type="button"
              key={option}
              className={`choice-pill ${value === option ? 'selected' : ''}`}
              aria-pressed={value === option}
              onClick={() => onChange(field.required === false && value === option ? '' : option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }
  const isNumber = field.kind === 'number';
  return (
    <label className="input-field">
      <span>{field.label}</span>
      {field.helper && <small className="field-helper">{field.helper}</small>}
      <div className="input-with-unit">
        <input
          type="text"
          inputMode={isNumber ? (field.integer ? 'numeric' : 'decimal') : undefined}
          value={value}
          placeholder={field.placeholder ?? ''}
          onChange={(event) => onChange(isNumber ? sanitizeNumber(event.target.value, Boolean(field.integer)) : event.target.value)}
        />
        {field.unit && <span className="input-unit">{field.unit}</span>}
      </div>
    </label>
  );
}

export function ServiceModal({ category, initialFrequency, onClose, onAdd }: Props) {
  const dialogRef = useDialog<HTMLElement>(onClose);
  const profile = useMemo(() => profileFor(category.name), [category.name]);
  const serviceOptions = profile.serviceOptions ?? [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [frequency, setFrequency] = useState(frequencies.includes(initialFrequency) ? initialFrequency : 'Semestral');
  const [service, setService] = useState(serviceOptions[0] ?? defaultService);
  const [extra, setExtra] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  const setValue = (label: string, value: string) => {
    setValues((current) => ({ ...current, [label]: value }));
    setError('');
  };

  const add = () => {
    const missing = profile.fields.filter((field) => field.required && !values[field.label]?.trim());
    if (missing.length) {
      setError(`Preencha: ${missing.map((field) => field.label).join(', ')}.`);
      return;
    }
    const invalid = profile.fields.filter((field) => {
      if (field.kind !== 'number') return false;
      const raw = values[field.label]?.trim();
      if (!raw) return false;
      const number = parseNumber(raw);
      return !Number.isFinite(number) || number <= 0;
    });
    if (invalid.length) {
      setError(`Informe um valor maior que zero em: ${invalid.map((field) => field.label).join(', ')}.`);
      return;
    }
    onAdd({
      id: `${category.id}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      category: category.name,
      icon: category.icon,
      quantity,
      service,
      frequency,
      details: formatDetails(profile.fields, values, service, extra),
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} tabIndex={-1} className="service-modal" role="dialog" aria-modal="true" aria-labelledby="service-modal-title">
        <header className="modal-heading">
          <div className="modal-title-wrap">
            <img src={asset(category.icon)} alt="" />
            <h2 id="service-modal-title">{category.name}</h2>
          </div>
          <button type="button" className="icon-button light" aria-label="Fechar" onClick={onClose}><Icon name="close" /></button>
        </header>
        <div className="modal-body">
          {profile.fields.map((field) => (
            <FieldControl key={field.label} field={field} value={values[field.label] ?? ''} onChange={(value) => setValue(field.label, value)} />
          ))}

          <section className="recurrence-card" aria-label="Frequência do serviço">
            <h3>Frequência do serviço</h3>
            <div className="recurrence-copy">
              <strong>Até 15% OFF nos serviços recorrentes</strong>
              <p>Com a recorrência você se programa e ganha descontos. Escolha a frequência de cada serviço, que será renovado de forma automática.</p>
            </div>
            <div className="choice-list recurrence-options">
              {frequencies.map((option) => (
                <button key={option} type="button" className={`choice-pill ${frequency === option ? 'selected' : ''}`} aria-pressed={frequency === option} onClick={() => setFrequency(option)}>{option}</button>
              ))}
            </div>
            <ul className="discount-list">
              {(frequencyBenefits[frequency] ?? []).map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>

          {serviceOptions.length > 0 && (
            <fieldset className="option-field">
              <legend>Serviços</legend>
              <div className="choice-list">
                {serviceOptions.map((option) => (
                  <button type="button" key={option} className={`choice-pill ${service === option ? 'selected' : ''}`} aria-pressed={service === option} onClick={() => setService(option)}>{option}</button>
                ))}
              </div>
            </fieldset>
          )}

          {profile.addOns?.length ? (
            <fieldset className="option-field">
              <legend>Serviços adicionais</legend>
              <div className="choice-list">
                {profile.addOns.map((option) => (
                  <button type="button" key={option} className={`choice-pill ${extra === option ? 'selected' : ''}`} aria-pressed={extra === option} onClick={() => setExtra(extra === option ? null : option)}>{option}</button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div className="quantity-line">
            <span id="modal-quantity-label">Quantidade</span>
            <div className="quantity-control" role="group" aria-labelledby="modal-quantity-label">
              <button type="button" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Icon name="minus" size={16} /></button>
              <output aria-live="polite">{quantity}</output>
              <button type="button" aria-label="Aumentar quantidade" disabled={quantity >= 99} onClick={() => setQuantity((value) => Math.min(99, value + 1))}><Icon name="plus" size={16} /></button>
            </div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <footer className="modal-footer">
          <p>Valor enviado junto com o orçamento</p>
          <button type="button" className="primary-button" onClick={add}>Adicionar ao carrinho <Icon name="arrow" size={17} /></button>
        </footer>
      </section>
    </div>
  );
}
