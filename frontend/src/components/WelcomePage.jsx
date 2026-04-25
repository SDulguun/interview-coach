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
      title: lang === 'mn' ? 'Бодит ярилцлагын дасгал' : 'Realistic mock interviews',
      body: lang === 'mn'
        ? '15 хүртэл асуулттай бүрэн ярилцлага — танилцуулга, сэдэл, туршлага, мэргэжлийн хэсгээр.'
        : 'Full interviews with up to 15 questions covering introduction, motivation, experience, and technical topics.',
    },
    {
      Icon: TrendingUp,
      title: lang === 'mn' ? 'Дэлгэрэнгүй үнэлгээ' : 'Detailed feedback',
      body: lang === 'mn'
        ? 'Хариулт бүрийн бүтэц, агуулга, хамаарлыг шинжилж, тодорхой зөвлөмж өгнө.'
        : 'Structure, content, and relevance analysis with clear improvement tips for every answer.',
    },
    {
      Icon: CheckCircle,
      title: lang === 'mn' ? '10+ мэргэжлийн салбар' : '10+ professional fields',
      body: lang === 'mn'
        ? 'IT, санхүү, маркетинг, боловсрол — салбар бүрт тохирсон асуулт.'
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
              <span className="landing-brand-name">InterviewCoach</span>
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
              <Button size="sm" onClick={onStart}>
                {lang === 'mn' ? 'Эхлэх' : 'Start'}
              </Button>
            </nav>
          </div>
        </header>

        <section className="landing-hero">
          <GlowBackground color="#7c3aed" size={320} opacity={0.35} top={-60} left="30%" />
          <GlowBackground color="#ec4899" size={220} opacity={0.2} bottom={-40} right="10%" />

          <div className="landing-hero-tag float-y">
            <span className="tag-dot" />
            {lang === 'mn' ? 'Шинэ — Илтгэх дасгал' : 'New — speaking practice'}
          </div>

          <h1 className="landing-hero-title">
            {lang === 'mn' ? (
              <>
                <span>Ярилцлагын өмнөх</span>
                <span className="gradient-text">сүүлийн бэлтгэл.</span>
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
              ? 'Бодит асуултуудад дасгал хийж, хариулт бүрдээ дэлгэрэнгүй үнэлгээ аваарай.'
              : 'Practice real questions and get detailed feedback on every answer.'}
          </p>

          <div className="landing-hero-actions">
            <Button size="lg" onClick={onStart}>
              {lang === 'mn' ? 'Ярилцлага эхлүүлэх' : 'Start interview'}
              <ArrowRight size={16} strokeWidth={1.5} />
            </Button>
            <Button variant="ghost" size="lg" onClick={() => setDemoOpen(true)}>
              <Play size={14} strokeWidth={1.5} />
              {lang === 'mn' ? '90 сек үзүүлэг' : '90s demo'}
            </Button>
          </div>

          <div className="landing-hero-meta">
            <span>◆ {lang === 'mn' ? 'AI-аар үнэлдэг' : 'AI-evaluated'}</span>
            <span>◆ {lang === 'mn' ? 'Монгол хэл дээр' : 'Mongolian + English'}</span>
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
            {lang === 'mn' ? 'Дасгалаа эхлүүлэхэд бэлэн үү?' : 'Ready to start practicing?'}
          </h2>
          <Button size="lg" onClick={onStart}>
            {lang === 'mn' ? 'Ярилцлага эхлүүлэх' : 'Start interview'}
            <ArrowRight size={16} strokeWidth={1.5} />
          </Button>
        </section>

        <footer className="landing-footer" id="footer">
          <span className="faint">InterviewCoach</span>
          <span className="faint">
            {lang === 'mn' ? 'Монгол, Англи хэлээр дэмжигдсэн' : 'Mongolian & English supported'}
          </span>
        </footer>
      </div>
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} onStart={onStart} />
    </PageTransition>
  );
}

export default WelcomePage;
