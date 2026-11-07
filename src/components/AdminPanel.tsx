import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

type Customer = { phone: string; role: 'customer' | 'admin'; quoteCount: number; createdAt: string };

type Props = { onClose: () => void };

function displayPhone(value: string) {
  if (value.length === 11) return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  if (value.length === 10) return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
  return value;
}

export function AdminPanel({ onClose }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    apiRequest<{ customers: Customer[] }>('/api/admin/customers')
      .then((result) => setCustomers(result.customers))
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Não foi possível carregar o painel.'))
      .finally(() => setBusy(false));
  }, []);
  const totalQuotes = customers.reduce((sum, customer) => sum + customer.quoteCount, 0);
  return (
    <div className="admin-card">
      <div className="admin-heading"><div><span className="eyebrow">ÁREA RESTRITA</span><h2>Painel Senário Clean</h2></div><button type="button" className="icon-button" aria-label="Fechar painel" onClick={onClose}>×</button></div>
      <div className="admin-summary"><div><strong>{customers.length}</strong><span>clientes</span></div><div><strong>{totalQuotes}</strong><span>orçamentos enviados</span></div></div>
      {busy && <p className="account-hint">Carregando clientes…</p>}
      {error && <p className="account-error" role="alert">{error}</p>}
      {!busy && !error && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Telefone</th><th>Contratações</th><th>Cadastro</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.phone}><td>{displayPhone(customer.phone)}{customer.role === 'admin' && <small>Administrador</small>}</td><td><strong>{customer.quoteCount}</strong></td><td>{new Date(customer.createdAt).toLocaleDateString('pt-BR')}</td></tr>)}</tbody></table>{!customers.length && <p className="account-hint">Nenhum cadastro ainda.</p>}</div>}
      <button type="button" className="secondary-button full-width" onClick={onClose}>Fechar painel</button>
    </div>
  );
}
