import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Code2, TrendingUp, Briefcase, GraduationCap,
  Mic, Sparkles, ArrowRight, Pause, Play,
} from 'lucide-react';
import { useLang } from '../lang';
import { ScoreCounter } from './ui';
import './demo-modal.css';

const STEPS_END = [15, 30, 50, 65, 85, 90];   // cumulative end-time for each step (s)
const TOTAL = 90;
const TICK = 250;   // ms

function formatClock(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function stepIndexFor(elapsed) {
  for (let i = 0; i < STEPS_END.length; i++) {
    if (elapsed < STEPS_END[i]) return i;
  }
  return STEPS_END.length - 1;
}

function stepStart(i) { return i === 0 ? 0 : STEPS_END[i - 1]; }

const CAPTIONS = {
  mn: [
    'Салбараа сонго — асуултууд тухайн салбарт тохирно.',
    'Хүндрэлийн түвшнээ сонго.',
    'Бичгээр эсвэл дуугаар хариул.',
    'AI бодит цагт зөвлөмж өгнө.',
    'Үр дүн, давуу талууд, сайжруулах хэсгүүдийг харна.',
    'Бэлэн үү? Үнэгүй эхлэх.',
  ],
  en: [
    'Pick your industry — questions adapt.',
    'Choose your difficulty.',
    'Answer by typing or by voice.',
    'AI gives real-time hints.',
    'See your score, strengths, and what to improve.',
    'Ready? Start free.',
  ],
};

function StepIndustry({ lang }) {
  const tiles = [
    { Icon: Code2,        label: lang === 'mn' ? 'Мэдээллийн технологи' : 'IT', glow: true },
    { Icon: TrendingUp,   label: lang === 'mn' ? 'Санхүү' : 'Finance' },
    { Icon: Briefcase,    label: lang === 'mn' ? 'Маркетинг' : 'Marketing' },
    { Icon: GraduationCap,label: lang === 'mn' ? 'Боловсрол' : 'Education' },
  ];
  return (
    <div className="demo-stage">
      <div className="demo-mini-industry">
        {tiles.map(({ Icon, label, glow }) => (
          <div key={label} className={`demo-tile ${glow ? 'glow' : ''}`}>
            <Icon size={16} strokeWidth={1.5} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepDifficulty({ lang }) {
  const cards = [
    { key: 'easy',   label: lang === 'mn' ? 'Хөнгөн' : 'Easy',   meta: '10 ' + (lang === 'mn' ? 'асуулт' : 'questions') },
    { key: 'medium', label: lang === 'mn' ? 'Дунд'   : 'Medium', meta: '15 ' + (lang === 'mn' ? 'асуулт' : 'questions'), highlight: true },
    { key: 'hard',   label: lang === 'mn' ? 'Хүнд'   : 'Hard',   meta: '17 ' + (lang === 'mn' ? 'асуулт' : 'questions') },
  ];
  return (
    <div className="demo-stage">
      <div className="demo-mini-difficulty">
        {cards.map(c => (
          <div key={c.key} className={`demo-diff-card ${c.highlight ? 'glow' : ''}`}>
            <div className="demo-diff-label">{c.label}</div>
            <div className="demo-diff-meta mono">{c.meta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Typewriter({ text, speed = 28 }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let i = 0;
    setShown('');
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return (
    <span>
      {shown}<span className="cursor-blink" />
    </span>
  );
}

function StepLive({ lang }) {
  const q = lang === 'mn'
    ? 'Хамгийн сүүлд шийдвэрлэсэн хүнд асуудлынхаа тухай ярина уу?'
    : 'Tell me about a difficult problem you recently solved.';
  const ans = lang === 'mn'
    ? 'Сүүлийн төсөлд маань API-ийн хариу удаашралттай байсан. Би profiling хийж DB query-г илрүүлээд...'
    : 'On my last project the API was slow. I profiled it, found a DB query bottleneck, and...';
  return (
    <div className="demo-stage">
      <div className="demo-mini-session">
        <div className="demo-rec">
          <span className="demo-rec-dot" />
          <span className="mono demo-rec-time">00:42</span>
        </div>
        <div className="demo-question">{q}</div>
        <div className="demo-answer-box">
          <Typewriter text={ans} />
        </div>
      </div>
    </div>
  );
}

function StepHints({ lang }) {
  const q = lang === 'mn'
    ? 'Багийн ажилд та ямар үүрэг гүйцэтгэдэг вэ?'
    : 'What role do you take on a team?';
  const hint = lang === 'mn'
    ? 'STAR бүтцийг ашиглан тодорхой жишээгээр баталгаажуул.'
    : 'Use the STAR structure with a concrete example.';
  return (
    <div className="demo-stage">
      <div className="demo-mini-hints">
        <div className="demo-hints-question">
          <div className="label">{lang === 'mn' ? 'Асуулт' : 'Question'}</div>
          <p>{q}</p>
        </div>
        <div className="demo-hints-panel glow">
          <div className="label">
            <Sparkles size={11} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -1 }} />
            {lang === 'mn' ? 'AI зөвлөмж' : 'AI hint'}
          </div>
          <p>{hint}</p>
        </div>
      </div>
    </div>
  );
}

function StepResults({ lang }) {
  return (
    <div className="demo-stage">
      <div className="demo-mini-results">
        <div className="demo-res-row">
          <div className="demo-res-left">
            <div className="label">{lang === 'mn' ? 'Ерөнхий оноо' : 'Overall score'}</div>
            <div className="demo-res-score gradient-text mono">
              <ScoreCounter target={78} duration={1400} />
            </div>
          </div>
          <div className="demo-res-stats">
            {[
              { k: lang === 'mn' ? 'Тодорхой' : 'Clarity',   v: 82 },
              { k: lang === 'mn' ? 'STAR'     : 'Structure', v: 74 },
              { k: lang === 'mn' ? 'Хамаарал' : 'Relevance', v: 80 },
            ].map(s => (
              <div key={s.k} className="demo-res-stat">
                <span className="mono">{s.v}</span>
                <span>{s.k}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCta({ lang, onStart }) {
  return (
    <div className="demo-stage demo-stage-center">
      <button className="demo-cta glow-pulse" onClick={onStart} type="button">
        {lang === 'mn' ? 'Эхлэх' : 'Start'}
        <ArrowRight size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function StepView({ index, lang, onStart }) {
  switch (index) {
    case 0: return <StepIndustry lang={lang} />;
    case 1: return <StepDifficulty lang={lang} />;
    case 2: return <StepLive lang={lang} />;
    case 3: return <StepHints lang={lang} />;
    case 4: return <StepResults lang={lang} />;
    case 5: return <StepCta lang={lang} onStart={onStart} />;
    default: return null;
  }
}

function DemoModal({ open, onClose, onStart }) {
  const { lang } = useLang();
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const tickRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setElapsed(0);
      setPaused(false);
    }
  }, [open]);

  // Tick
  useEffect(() => {
    if (!open || paused) return;
    tickRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + TICK / 1000;
        return next >= TOTAL ? 0 : next;   // loop
      });
    }, TICK);
    return () => clearInterval(tickRef.current);
  }, [open, paused]);

  // Esc close + body scroll lock
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const idx = stepIndexFor(elapsed);
  const captions = CAPTIONS[lang] || CAPTIONS.en;
  const progress = (elapsed / TOTAL) * 100;

  function goTo(i) {
    const clamped = Math.max(0, Math.min(STEPS_END.length - 1, i));
    setElapsed(stepStart(clamped));
    setPaused(true);
  }

  function handleStart() {
    onClose?.();
    onStart?.();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="demo-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="demo-modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="demo-head">
              <span className="mono demo-clock">
                {formatClock(elapsed)} / {formatClock(TOTAL)}
              </span>
              <button className="demo-close" onClick={onClose} type="button" aria-label="Close demo">
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="demo-canvas">
              <AnimatePresence mode="wait">
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="demo-canvas-inner"
                >
                  <StepView index={idx} lang={lang} onStart={handleStart} />
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={`cap-${idx}`}
                className="demo-caption"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {captions[idx]}
              </motion.p>
            </AnimatePresence>

            <div className="demo-progress">
              <div className="demo-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="demo-controls">
              <button
                className="demo-pause"
                onClick={() => setPaused(p => !p)}
                type="button"
              >
                {paused
                  ? <><Play size={12} strokeWidth={1.5} /> {lang === 'mn' ? 'Үргэлжлүүлэх' : 'Resume'}</>
                  : <><Pause size={12} strokeWidth={1.5} /> {lang === 'mn' ? 'Зогсоох' : 'Pause'}</>}
              </button>

              <div className="demo-step-buttons">
                <button
                  className="demo-step-btn"
                  type="button"
                  onClick={() => goTo(idx - 1)}
                  disabled={idx === 0}
                >
                  ← {lang === 'mn' ? 'Өмнөх' : 'Prev'}
                </button>
                <button
                  className="demo-step-btn"
                  type="button"
                  onClick={() => goTo(idx + 1)}
                  disabled={idx === STEPS_END.length - 1}
                >
                  {lang === 'mn' ? 'Дараах' : 'Next'} →
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DemoModal;
