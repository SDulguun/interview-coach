import { useLang } from '../lang';
import illustInterview from '../assets/illust-interview.jpg';
import illustResumes from '../assets/illust-resumes.jpg';

function WelcomePage({ onStart }) {
  const { t, lang, toggleLang } = useLang();

  return (
    <div className="landing">
      {/* Top Navigation */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="landing-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="landing-brand-name">InterviewCoach</span>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-lang-btn" onClick={toggleLang}>
              <span className="landing-lang-badge">{lang.toUpperCase()}</span>
              {lang === 'mn' ? 'English' : 'Монгол'}
            </button>
            <button className="landing-nav-cta" onClick={onStart}>
              {t('welcome_cta')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            {lang === 'mn' ? 'Ярилцлагын бэлтгэл' : 'Interview Practice'}
          </div>
          <h1 className="landing-hero-title">
            {lang === 'mn'
              ? 'Ажлын ярилцлагандаа бэлдэж, итгэлтэй хариулаарай'
              : 'Practice Your Answers. Walk In Confident.'}
          </h1>
          <p className="landing-hero-desc">
            {lang === 'mn'
              ? 'Бодит ярилцлагын асуултуудад дасгал хийж, хариулт бүрдээ дэлгэрэнгүй үнэлгээ аваарай. 10 гаруй салбарын мэргэжлийн асуултууд бэлэн.'
              : 'Practice with real interview questions and get detailed feedback on every answer. Questions ready for 10+ professional fields.'}
          </p>
          <div className="landing-hero-actions">
            <button className="landing-hero-cta" onClick={onStart}>
              {t('pre_session_start')}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </button>
            <span className="landing-hero-hint">
              {lang === 'mn' ? '5-15 минутын дасгал · Үнэ төлбөргүй' : '5-15 min sessions · Free'}
            </span>
          </div>
        </div>
        <div className="landing-hero-visual">
          <img src={illustInterview} alt="" className="landing-hero-illustration" />
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-features-inner">
          <div className="landing-feature-card">
            <div className="feature-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>{lang === 'mn' ? 'Бодит ярилцлагын дасгал' : 'Realistic Mock Interviews'}</h3>
            <p>{lang === 'mn' ? '15 хүртэл асуулттай бүрэн ярилцлага. Танилцуулга, туршлага, сэдэл, мэргэжлийн асуултуудыг дарааллаар нь дасгалла.' : 'Full interviews with up to 15 questions covering introduction, experience, motivation, and technical topics.'}</p>
          </div>
          <div className="landing-feature-card">
            <div className="feature-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
              </svg>
            </div>
            <h3>{lang === 'mn' ? 'Дэлгэрэнгүй үнэлгээ' : 'Detailed Feedback'}</h3>
            <p>{lang === 'mn' ? 'Хариулт бүрийн бүтэц, агуулга, хамаарлыг шинжилж, тодорхой зөвлөмж өгнө.' : 'Structure, content, and relevance analysis with clear improvement tips for every answer.'}</p>
          </div>
          <div className="landing-feature-card">
            <div className="feature-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h3>{lang === 'mn' ? '10+ мэргэжлийн салбар' : '10+ Professional Fields'}</h3>
            <p>{lang === 'mn' ? 'IT, санхүү, маркетинг, боловсрол зэрэг салбар бүрт тохирсон асуултуудаар дасгал хийгээрэй.' : 'Tailored questions for IT, finance, marketing, education, and more.'}</p>
          </div>
        </div>
      </section>

      {/* Session Preview */}
      <section className="landing-sessions">
        <div className="landing-sessions-inner">
          <h2>{lang === 'mn' ? 'Дасгалын горимууд' : 'Practice Modes'}</h2>
          <div className="landing-session-cards">
            <div className="landing-session-card">
              <div className="session-card-number">5</div>
              <h3>{t('session_type_quick')}</h3>
              <p>{lang === 'mn' ? '~8 минут · Гол асуултууд' : '~8 min · Key questions'}</p>
            </div>
            <div className="landing-session-card featured">
              <div className="session-card-badge">{lang === 'mn' ? 'Санал болгох' : 'Recommended'}</div>
              <div className="session-card-number">12</div>
              <h3>{lang === 'mn' ? 'Стандарт ярилцлага' : 'Standard Interview'}</h3>
              <p>{lang === 'mn' ? '~20 минут · Бүрэн бүтэцтэй' : '~20 min · Full structure'}</p>
            </div>
            <div className="landing-session-card">
              <div className="session-card-number">15</div>
              <h3>{lang === 'mn' ? 'Бүрэн ярилцлага' : 'Full Mock Interview'}</h3>
              <p>{lang === 'mn' ? '~30 минут · Нарийвчилсан' : '~30 min · Comprehensive'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="landing-bottom-cta">
        <img src={illustResumes} alt="" className="landing-bottom-illustration" />
        <h2>{lang === 'mn' ? 'Дасгалаа эхлүүлэхэд бэлэн үү?' : 'Ready to start practicing?'}</h2>
        <button className="landing-hero-cta" onClick={onStart}>
          {t('welcome_cta')}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span>InterviewCoach</span>
        <span>{lang === 'mn' ? 'Монгол, Англи хэлээр дэмжигдсэн' : 'Mongolian & English supported'}</span>
      </footer>
    </div>
  );
}

export default WelcomePage;
