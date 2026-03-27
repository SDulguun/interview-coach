import { useState } from 'react';
import { useLang } from '../lang';

function Layout({ children, phase, onNavigate }) {
  const { lang, t, toggleLang } = useLang();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      key: 'setup',
      label: t('nav_dashboard'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      key: 'interview',
      label: t('nav_practice'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      key: 'history',
      label: t('nav_history'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20v-4" />
        </svg>
      ),
    },
  ];

  const pageTitle = {
    setup: t('nav_dashboard'),
    interview: t('nav_practice'),
    results: t('nav_history'),
    history: t('nav_history'),
  };

  function handleNav(key) {
    if (onNavigate) onNavigate(key);
    setSidebarOpen(false);
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>AI Interview Coach</h1>
          <p className="subtitle">{t('header_subtitle')}</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`sidebar-nav-item ${phase === item.key || (item.key === 'history' && phase === 'results') ? 'active' : ''}`}
              onClick={() => handleNav(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="lang-toggle" onClick={toggleLang}>
            {lang === 'mn' ? 'EN / English' : 'MN / Монгол'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="app-main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <span className="topbar-title">{pageTitle[phase] || t('nav_dashboard')}</span>
          </div>
        </header>

        <main className="app-container">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
