import { useState } from 'react';
import { User } from 'lucide-react';
import { registerUser, loginUser } from '../auth';
import { useLang } from '../lang';
import { Button, PageTransition } from './ui';
import './auth-page.css';

export default function AuthPage({ onLogin, onGuest }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, lang } = useLang();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError(t('auth_error_fields_required'));
      return;
    }
    if (password.trim().length < 4) {
      setError(lang === 'mn' ? 'Нууц үг хамгийн багадаа 4 тэмдэгт байх хэрэгтэй' : 'Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        if (!displayName.trim()) {
          setError(t('auth_error_fields_required'));
          setLoading(false);
          return;
        }
        const result = await registerUser(username.trim(), password, displayName.trim());
        if (!result.success) {
          setError(t(`auth_error_${result.error}`));
          setLoading(false);
          return;
        }
        onLogin(result.user);
      } else {
        const result = await loginUser(username.trim(), password);
        if (!result.success) {
          setError(t(`auth_error_${result.error}`));
          setLoading(false);
          return;
        }
        onLogin(result.user);
      }
    } catch {
      setError(lang === 'mn' ? 'Ямар нэг алдаа гарлаа. Дахин оролдоорой.' : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition keyName="auth">
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-icon">
            <User size={20} strokeWidth={1.5} color="#fff" />
          </div>
          <h2 className="auth-title">
            {mode === 'login'
              ? (lang === 'mn' ? 'Тавтай Морил' : 'Welcome Back')
              : (lang === 'mn' ? 'Бүртгэл Үүсгэх' : 'Create Account')}
          </h2>
          <p className="auth-sub subtle">
            {lang === 'mn'
              ? 'Ярилцлагын дасгалаа үргэлжлүүлээрэй'
              : 'Continue your interview practice'}
          </p>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
              type="button"
            >
              {t('auth_login')}
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
              type="button"
            >
              {t('auth_register')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>{t('auth_username')}</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={lang === 'mn' ? 'хэрэглэгчийн нэр' : 'username'}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label>{t('auth_password')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={lang === 'mn' ? 'нууц үг' : 'password'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                disabled={loading}
              />
            </div>

            {mode === 'register' && (
              <div className="auth-field">
                <label>{t('auth_display_name')}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={lang === 'mn' ? 'жнь: Б. Болд' : 'e.g. B. Bold'}
                  disabled={loading}
                />
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <Button type="submit" size="lg" disabled={loading} style={{ width: '100%' }}>
              {loading
                ? (lang === 'mn' ? 'Уншиж байна…' : 'Loading…')
                : mode === 'login' ? t('auth_login') : t('auth_register')}
            </Button>
          </form>

          <Button variant="ghost" onClick={onGuest} disabled={loading} style={{ width: '100%' }}>
            {t('auth_guest')}
          </Button>
          <p className="auth-guest-hint faint">{t('auth_guest_hint')}</p>
        </div>
      </div>
    </PageTransition>
  );
}
