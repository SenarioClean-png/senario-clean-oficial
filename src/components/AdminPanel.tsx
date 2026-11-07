import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

type Customer = { phone: string; role: 'customer' | 'admin'; quoteCount: number; contractedCount: number; createdAt: string };
type Quote = { id: number; phone: string; status: 'pending' | 'contracted'; message: string; createdAt: string };
type Props = { onClose: () => void };

function displayPhone(value: string) {
  if (value.length === 11) return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  if (value.length === 10) return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
  return value;
}

function displayMessage(value: string) {
  const firstLine = value.replace(/\*/g, '').split('\n').find((line) => line.trim());
  return firstLine?.slice(0, 90) || 'Pedido de orçamento';
}

export function AdminPanel({ onClose }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = async () => {
    setBusy(true);
    try {
      const [customerResult, quoteResult] = await Promise.all([
        apiRequest<{ customers: Customer[] }>('/api/admin/customers'),
        apiRequest<{ quotes: Quote[] }>('/api/admin/quotes'),
      ]);
      setCustomers(customerResult.customers);
      setQuotes(quoteResult.quotes);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar o painel.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const changeStatus = async (quote: Quote, status: Quote['status']) => {
    if (status === quote.status) return;
    setUpdating(quote.id);
    try {
      await apiRequest(`/api/admin/quotes/${quote.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível atualizar o orçamento.');
    } finally {
      setUpdating(null);
    }
  };

  const totalContracts = customers.reduce((sum, customer) => sum + customer.contractedCount, 0);
  const totalPending = quotes.filter((quote) => quote.status === 'pending').length;

  return (
    <div className="admin-card">
      <div className="admin-heading"><div><span className="eyebrow">ÁREA RESTRITA</span><h2>Painel Senário Clean</h2></div><button type="button" className="icon-button" aria-label="Fechar painel" onClick={onClose}>×</button></div>
      <p className="admin-explanation">Todo orçamento entra como <strong>pendente</strong>. Quando o cliente fechar o serviço, altere manualmente para <strong>contratado</strong>.</p>
      <div className="admin-summary"><div><strong>{customers.length}</strong><span>clientes</span></div><div><strong>{totalPending}</strong><span>pendentes</span></div><div><strong>{totalContracts}</strong><span>contratados</span></div></div>
      {busy && <p className="account-hint">Carregando dados…</p>}
      {error && <p className="account-error" role="alert">{error}</p>}
      {!busy && !error && <>
        <section className="admin-section"><h3>Resumo por cliente</h3><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Telefone</th><th>Orçamentos</th><th>Contratados</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.phone}><td>{displayPhone(customer.phone)}{customer.role === 'admin' && <small>Administrador</small>}</td><td>{customer.quoteCount}</td><td><strong>{customer.contractedCount}</strong></td></tr>)}</tbody></table>{!customers.length && <p className="account-hint">Nenhum cadastro ainda.</p>}</div></section>
        <section className="admin-section"><h3>Orçamentos — atualizar situação</h3><div className="admin-table-wrap"><table className="admin-table admin-quotes-table"><thead><tr><th>Cliente</th><th>Pedido</th><th>Data</th><th>Situação</th></tr></thead><tbody>{quotes.map((quote) => <tr key={quote.id}><td>{displayPhone(quote.phone)}</td><td title={quote.message}>{displayMessage(quote.message)}</td><td>{new Date(quote.createdAt).toLocaleDateString('pt-BR')}</td><td><select className={`status-select ${quote.status}`} value={quote.status} disabled={updating === quote.id} onChange={(event) => void changeStatus(quote, event.target.value as Quote['status'])}><option value="pending">Pendente</option><option value="contracted">Contratado</option></select></td></tr>)}</tbody></table>{!quotes.length && <p className="account-hint">Nenhum orçamento enviado ainda.</p>}</div></section>
      </>}
      <button type="button" className="secondary-button full-width" onClick={onClose}>Fechar painel</button>
    </div>
  );
}
