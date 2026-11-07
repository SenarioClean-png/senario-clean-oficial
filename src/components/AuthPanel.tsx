import { useState } from 'react';
import type { FormEvent } from 'react';
import { authRequest, type AuthUser } from '../lib/api';

type Props = {
  tab: 'login' | 'register';
  onTabChange: (tab: 'login' | 'register') => void;
  onSuccess: (user: AuthUser) => void;
  onClose: () => void;
};

function cleanPhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 13);
}

export function AuthPanel({ tab, onTabChange, onSuccess, onClose }: Props) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = tab === 'register';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      setError('A senha precisa ter exatamente 6 números.');
      return;
    }
    if (cleanPhone(phone).length < 10) {
      setError('Informe um telefone com DDD.');
      return;
    }
    setBusy(true);
    try {
      const result = await authRequest(isRegister ? '/api/auth/register' : '/api/auth/login', phone, pin);
      onSuccess(result.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível concluir.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="account-card">
      <div className="account-tabs" role="tablist" aria-label="Conta">
        <button type="button" className={tab === 'login' ? 'active' : ''} onClick={() => { onTabChange('login'); setError(''); }}>Entrar</button>
        <button type="button" className={tab === 'register' ? 'active' : ''} onClick={() => { onTabChange('register'); setError(''); }}>Criar cadastro</button>
      </div>
      <p className="account-lead">{isRegister ? 'Cadastre-se para enviar seus pedidos e acompanhar seus atendimentos.' : 'Entre para enviar um orçamento com segurança.'}</p>
      <form className="account-form" onSubmit={submit}>
        <label>Telefone<input autoFocus required type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(cleanPhone(event.target.value))} placeholder="(11) 99999-9999" /></label>
        <label>Senha de 6 dígitos<input required type="password" inputMode="numeric" autoComplete={isRegister ? 'new-password' : 'current-password'} maxLength={6} pattern="[0-9]{6}" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" /></label>
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="primary-button full-width" type="submit" disabled={busy}>{busy ? 'Aguarde…' : isRegister ? 'Criar minha conta' : 'Entrar'}</button>
      </form>
      <p className="account-hint">Usamos seu telefone apenas para identificar sua conta e registrar seus pedidos.</p>
      <button type="button" className="secondary-button full-width" onClick={onClose}>Fechar</button>
    </div>
  );
}
