import { useState } from 'react';
import { useLang } from '../lang';
import { MessageSquare, TrendingUp, CheckCircle, ArrowRight, Play } from 'lucide-react';
import { Button, Kbd, GlowBackground, PageTransition } from './ui';
import DemoModal from './DemoModal';
import './welcome-page.css';

function WelcomePage({ onStart, onOpenPalette }) {
  const { t, lang, toggleLang } = useLang();
  const [demoOpen, setDemoOpen] = useState(false);

  const features = [
    {
      Icon: MessageSquare,
      title: lang === 'mn' ? 'Бодит Ярилцлагын Мэдрэмж' : 'Realistic Mock Interviews',
      body: lang === 'mn'
        ? 'Жинхэнэ ярилцлагынх шиг асуултаар бэлдэж, өөртөө итгэлтэй болоорой.'
        : 'Full interviews with up to 15 questions covering introduction, motivation, experience, and technical topics.',
    },
    {
      Icon: TrendingUp,
      title: lang === 'mn' ? 'Хариулт Тань Дээр Тулгуурласан Үнэлгээ' : 'Detailed Feedback',
      body: lang === 'mn'
        ? 'Юу амжилттай хэлсэн, юу сайжруулахаа хариулт бүрээс мэдэж аваарай.'
        : 'Structure, content, and relevance analysis with clear improvement tips for every answer.',
    },
    {
      Icon: CheckCircle,
      title: lang === 'mn' ? 'Монголын Зах Зээлд Тохирсон' : '10+ Professional Fields',
      body: lang === 'mn'
        ? 'Орон нутгийн ажил олгогчдын асуудаг асуултаар, монгол хэлээр бэлдээрэй.'
        : 'Tailored questions for IT, finance, marketing, education, and more.',
    },
  ];

  return (
    <PageTransition keyName="welcome">
      <div className="landing">
        <header className="landing-nav">
          <div className="landing-nav-inner">
            <div className="landing-brand">
              <div className="landing-brand-icon">IC</div>
              <span className="landing-brand-name">
                InterviewCoach
                {lang === 'mn' && (
                  <span className="landing-brand-accent" aria-hidden="true">⁂</span>
                )}
              </span>
            </div>
            <nav className="landing-nav-right">
              <a className="landing-nav-link" href="#footer">
                {lang === 'mn' ? 'Бүлгэм' : 'Community'}
              </a>
              <button
                className="landing-kbd-hint"
                onClick={() => onOpenPalette?.()}
                aria-label="Open command palette"
              >
                <Kbd>⌘K</Kbd>
              </button>
              <button className="landing-lang-btn" onClick={toggleLang}>
                {lang === 'mn' ? 'EN' : 'MN'}
              </button>
            </nav>
          </div>
        </header>

        <section className="landing-hero">
          {lang === 'mn' ? (
            <>
              <GlowBackground color="#3b82f6" size={340} opacity={0.32} top={-60} left="28%" />
              <GlowBackground color="#d4a574" size={240} opacity={0.22} bottom={-40} right="10%" />
            </>
          ) : (
            <>
              <GlowBackground color="#7c3aed" size={320} opacity={0.35} top={-60} left="30%" />
              <GlowBackground color="#ec4899" size={220} opacity={0.2} bottom={-40} right="10%" />
            </>
          )}

          <div className="landing-hero-tag float-y">
            <span className="tag-dot" />
            {lang === 'mn' ? 'Шинэ — Уран яриагаа уулзалтад бэлдэе' : 'New — speaking practice'}
          </div>

          <h1 className="landing-hero-title">
            {lang === 'mn' ? (
              <>
                <span>Ярилцлагын өмнөх</span>
                <span className="gradient-text gradient-tengri">сүүлийн бэлтгэл.</span>
              </>
            ) : (
              <>
                <span>Your last prep</span>
                <span className="gradient-text">before the interview.</span>
              </>
            )}
          </h1>

          <p className="landing-hero-sub">
            {lang === 'mn'
              ? 'Бодит асуултуудаар дасгалаа хийж, хариулт бүрдээ нарийн үнэлгээ, тодорхой зөвлөмж аваарай.'
              : 'Practice real questions and get detailed feedback on every answer.'}
          </p>

          <div className="landing-hero-actions">
            <Button size="lg" onClick={onStart}>
              {lang === 'mn' ? 'Ярилцлага Эхлүүлэх' : 'Start Interview'}
              <ArrowRight size={16} strokeWidth={1.5} />
            </Button>
            <Button variant="ghost" size="lg" onClick={() => setDemoOpen(true)}>
              <Play size={14} strokeWidth={1.5} />
              {lang === 'mn' ? '90 сек үзүүлэг' : '90s demo'}
            </Button>
          </div>

          <div className="landing-hero-meta">
            <span>◆ {lang === 'mn' ? 'AI-аар үнэлдэг' : 'AI-evaluated'}</span>
            <span>◆ {lang === 'mn' ? 'Монгол Хэл Дээр' : 'Mongolian + English'}</span>
            <span>◆ {lang === 'mn' ? 'Үнэгүй' : 'Free'}</span>
          </div>
        </section>

        <section className="landing-features" id="features">
          <div className="landing-features-inner">
            {features.map(({ Icon, title, body }) => (
              <div key={title} className="card card-hover landing-feature-card">
                <div className="feature-icon-wrap">
                  <Icon size={14} strokeWidth={1.5} />
                </div>
                <h3>{title}</h3>
                <p className="subtle">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-final-cta">
          <h2>
            {lang === 'mn' ? 'Анхны асуултаа хүлээж авахад бэлэн үү?' : 'Ready to start practicing?'}
          </h2>
          <Button size="lg" onClick={onStart}>
            {lang === 'mn' ? 'Ярилцлага Эхлүүлэх' : 'Start Interview'}
            <ArrowRight size={16} strokeWidth={1.5} />
          </Button>
        </section>

        <footer className="landing-footer" id="footer">
          <span className="faint">InterviewCoach</span>
          {lang === 'mn' && (
            <span className="landing-footer-olzii" aria-hidden="true">⊛</span>
          )}
          <span className="faint">
            {lang === 'mn' ? 'Монгол хэлнээ дөхөм, англи хэлэнд бэлэн' : 'Mongolian & English supported'}
          </span>
        </footer>
      </div>
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} onStart={onStart} />
    </PageTransition>
  );
}

export default WelcomePage;
