import { useState } from 'react';
import { registerUser, loginUser } from '../auth';
import { useLang } from '../lang';

export default function AuthPage({ onLogin, onGuest }) {
  const [mode, setMode] = useState('login'); // login | register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const { t, lang } = useLang();

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError(t('auth_error_fields_required'));
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        setError(t('auth_error_fields_required'));
        return;
      }
      const result = registerUser(username.trim(), password, displayName.trim());
      if (!result.success) {
        setError(t(`auth_error_${result.error}`));
        return;
      }
      onLogin(result.user);
    } else {
      const result = loginUser(username.trim(), password);
      if (!result.success) {
        setError(t(`auth_error_${result.error}`));
        return;
      }
      onLogin(result.user);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="landing-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h1>{lang === 'mn' ? 'AI Ярилцлагын Дасгалжуулагч' : 'AI Interview Coach'}</h1>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            {t('auth_login')}
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            {t('auth_register')}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>{t('auth_username')}</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={lang === 'mn' ? 'Хэрэглэгчийн нэр' : 'Username'}
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label>{t('auth_password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={lang === 'mn' ? 'Нууц үг' : 'Password'}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </div>

          {mode === 'register' && (
            <div className="auth-field">
              <label>{t('auth_display_name')}</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={lang === 'mn' ? 'Жнь: Б. Болд' : 'e.g. B. Bold'}
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {mode === 'login' ? t('auth_login') : t('auth_register')}
          </button>
        </form>

        <button className="auth-guest-btn" onClick={onGuest}>
          {t('auth_guest')}
        </button>
        <p className="auth-guest-hint">{t('auth_guest_hint')}</p>
      </div>
    </div>
  );
}
