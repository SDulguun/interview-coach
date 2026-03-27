import { useLang } from '../lang';

function WelcomePage({ onStart }) {
  const { t } = useLang();

  return (
    <div className="welcome-page">
      {/* Floating background shapes */}
      <div className="welcome-shape welcome-shape-1" />
      <div className="welcome-shape welcome-shape-2" />
      <div className="welcome-shape welcome-shape-3" />
      <div className="welcome-shape welcome-shape-4" />

      <div className="welcome-content">
        <div className="welcome-logo animate-welcome" style={{ animationDelay: '0.1s' }}>
          AI
        </div>

        <h1 className="welcome-title animate-welcome" style={{ animationDelay: '0.2s' }}>
          AI Interview Coach
        </h1>

        <p className="welcome-subtitle animate-welcome" style={{ animationDelay: '0.3s' }}>
          {t('header_subtitle')}
        </p>

        <p className="welcome-tagline animate-welcome" style={{ animationDelay: '0.4s' }}>
          {t('welcome_tagline')}
        </p>

        <button
          className="welcome-cta animate-welcome"
          style={{ animationDelay: '0.5s' }}
          onClick={onStart}
        >
          {t('welcome_cta')} <span className="welcome-cta-arrow">&rarr;</span>
        </button>

        <div className="welcome-stats animate-welcome" style={{ animationDelay: '0.7s' }}>
          <div className="welcome-stat-card">
            <span className="welcome-stat-number">500+</span>
            <span className="welcome-stat-label">{t('welcome_users')}</span>
          </div>
          <div className="welcome-stat-card">
            <span className="welcome-stat-number welcome-stat-green">85%</span>
            <span className="welcome-stat-label">{t('welcome_avg_score')}</span>
          </div>
          <div className="welcome-stat-card">
            <span className="welcome-stat-number welcome-stat-purple">10+</span>
            <span className="welcome-stat-label">{t('welcome_fields')}</span>
          </div>
        </div>
      </div>

      <div className="welcome-footer animate-welcome" style={{ animationDelay: '0.9s' }}>
        Powered by AI &bull; v1.0
      </div>
    </div>
  );
}

export default WelcomePage;
