import { useState } from 'react';
import { useLang } from '../lang';
const PHASE_HINTS = {
  setup: { mn: 'Ажлын байр, түвшин сонгоод бэлтгэл хийнэ', en: 'Choose a role and difficulty to begin' },
  interview: { mn: 'Асуултуудад тодорхой, жишээтэй хариулаарай', en: 'Answer clearly with examples' },
  results: { mn: 'Үр дүнгээ хянаж, давуу ба сул талуудаа олоорой', en: 'Review your strengths and areas to improve' },
  history: { mn: 'Өмнөх ярилцлагуудын түүх', en: 'Past interview sessions' },
  guides: { mn: 'Ярилцлагын бэлтгэлийн заавар', en: 'Interview preparation guides' },
};

function Layout({ children, phase, onNavigate, onLogout, currentUser }) {
  const { lang, t, toggleLang } = useLang();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      key: 'setup',
      label: t('nav_practice'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      key: 'guides',
      label: t('nav_guides'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
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
    setup: t('nav_practice'),
    interview: t('nav_practice'),
    results: t('step_results'),
    history: t('nav_history'),
    guides: t('nav_guides'),
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
          <h1>Interview Coach</h1>
          <p className="subtitle">{t('header_subtitle')}</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`sidebar-nav-item ${
                phase === item.key ||
                (item.key === 'setup' && (phase === 'interview' || phase === 'results'))
                  ? 'active' : ''
              }`}
              onClick={() => handleNav(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-hint">
          <p>{(PHASE_HINTS[phase] || PHASE_HINTS.setup)[lang]}</p>
        </div>

        <div className="sidebar-footer">
          {currentUser && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{currentUser.displayName}</span>
              <button className="logout-btn" onClick={onLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {t('logout')}
              </button>
            </div>
          )}
          <button className="lang-toggle" onClick={toggleLang}>
            <span className="lang-badge">{lang.toUpperCase()}</span>
            {lang === 'mn' ? 'English' : 'Монгол'}
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
            <span className="topbar-title">{pageTitle[phase] || t('nav_practice')}</span>
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
