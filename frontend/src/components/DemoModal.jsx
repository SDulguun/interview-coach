import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Code2, TrendingUp, Briefcase, GraduationCap,
  Sparkles, ArrowRight, Pause, Play,
} from 'lucide-react';
import { useLang } from '../lang';
import { ScoreCounter } from './ui';
import './demo-modal.css';

const STEPS_END = [15, 30, 50, 65, 85, 90];
const TOTAL = 90;
const TICK = 250;

const INDUSTRY_KEYS = ['it', 'finance', 'marketing', 'education'];

const INDUSTRIES = {
  it:        { Icon: Code2,         mn: 'Мэдээллийн технологи', en: 'IT' },
  finance:   { Icon: TrendingUp,    mn: 'Санхүү',                en: 'Finance' },
  marketing: { Icon: Briefcase,     mn: 'Маркетинг',             en: 'Marketing' },
  education: { Icon: GraduationCap, mn: 'Боловсрол',             en: 'Education' },
};

const QA = {
  it: {
    mn: {
      q: 'Сүүлд ажилласан төслөө танилцуулна уу.',
      a: 'Сүүлийн 6 сард Python-аар бичсэн API хийсэн. Хэрэглэгчдийн хүсэлтийн хариу 200мс-аас бууруулсан...',
    },
    en: {
      q: 'Tell me about a recent project you worked on.',
      a: 'Over the last 6 months I built a Python API. Brought p95 latency down from 200ms to under 80ms by...',
    },
  },
  finance: {
    mn: {
      q: 'Аудитын процесст оролцсон туршлагаа хуваалцана уу.',
      a: 'Өмнөх компанид жилийн санхүүгийн тайланг шалгахад оролцсон. Зөрүү гарсан хэсгийг...',
    },
    en: {
      q: 'Walk me through a time you took part in an audit.',
      a: 'At my previous company I helped review the annual financial statements. When discrepancies came up I...',
    },
  },
  marketing: {
    mn: {
      q: 'Хамгийн амжилттай кампанит ажлаа ярина уу.',
      a: 'Сошиал сувгийн гүйцэтгэлийг 3 дахин нэмэгдүүлсэн. Контентийн стратеги, аудиторийн сегментчиллийг...',
    },
    en: {
      q: 'Tell me about your most successful campaign.',
      a: 'I tripled our social channel performance. The content strategy and audience segmentation came from...',
    },
  },
  education: {
    mn: {
      q: 'Хүнд суралцагчтай хэрхэн ажилласан туршлагаа ярина уу.',
      a: 'Анхаарал төвлөрөхөд хүндрэлтэй сурагчтай ажиллахдаа богино даалгавар, ойр ойр амралттай...',
    },
    en: {
      q: 'Walk me through working with a struggling learner.',
      a: 'For a student who had trouble focusing, I broke work into short blocks with frequent breaks and...',
    },
  },
};

const HINTS = {
  it: {
    mn: 'Техникийн нарийвчлал — ашигласан технологи, хэмжигдэхүйц үр дүнг (latency, ачаалал) дурдвал илүү сайн.',
    en: 'Show technical depth — name the stack and quote a measurable result (latency, throughput).',
  },
  finance: {
    mn: 'Тоон нарийвчлал чухал — мөнгөн дүн, хувь, хугацаагаа тодорхой хэлвэл итгэл төрүүлнэ.',
    en: 'Numbers matter — quote the amounts, percentages, and timeframe to come across as precise.',
  },
  marketing: {
    mn: 'Үр дүнг хэмжээгээр харуул — өсөлтийн хувь, ROI, аудиторын тоо чухал.',
    en: 'Show measurable outcomes — growth %, ROI, and audience size carry the most weight.',
  },
  education: {
    mn: 'Сурагчийн хувийн ахиц чухал — хийсэн дасгал, ажиглалт, үр дүнг тодорхой ярь.',
    en: 'Anchor on the learner\'s progress — describe the activity, observation, and outcome.',
  },
};

const RESULT_TOPICS = {
  it: {
    mn: ['Техник', 'STAR', 'Нарийвчлал'],
    en: ['Technical', 'STAR', 'Precision'],
  },
  finance: {
    mn: ['Тоо', 'Нарийвчлал', 'Хамаарал'],
    en: ['Numbers', 'Precision', 'Relevance'],
  },
  marketing: {
    mn: ['Үр дүн', 'Стратеги', 'Хамаарал'],
    en: ['Outcome', 'Strategy', 'Relevance'],
  },
  education: {
    mn: ['Жишээ', 'Ажиглалт', 'Үр дүн'],
    en: ['Example', 'Observation', 'Outcome'],
  },
};

const CAPTIONS = {
  mn: [
    'Салбараа сонгоно уу — асуултууд тань салбарт нийцнэ.',
    'Түвшнээ сонгоорой.',
    'Бичгээр эсвэл дуугаар хариул.',
    'AI шууд зөвлөмж өгнө.',
    'Үр дүн, давуу тал, сайжруулах талаа харна.',
    'Бэлэн үү?',
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

/* ---------- Steps ---------- */

function StepIndustry({ lang, selected, onSelect, toast }) {
  return (
    <div className="demo-stage demo-stage-industry">
      <div className="demo-mini-industry">
        {INDUSTRY_KEYS.map(key => {
          const { Icon, mn, en } = INDUSTRIES[key];
          const label = lang === 'mn' ? mn : en;
          const isSelected = selected === key;
          return (
            <button
              key={key}
              type="button"
              className={`demo-tile ${isSelected ? 'glow' : ''}`}
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
            >
              <Icon size={16} strokeWidth={1.5} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            className="demo-industry-toast mono"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            {lang === 'mn' ? 'Сонгосон: ' : 'Selected: '}{toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DIFFICULTY_META = {
  easy:   { questions: 10, minutes: 15 },
  medium: { questions: 15, minutes: 25 },
  hard:   { questions: 20, minutes: 35 },
};

function StepDifficulty({ lang, selected, onSelect }) {
  const cards = [
    { key: 'easy',   label: lang === 'mn' ? 'Хөнгөн' : 'Easy' },
    { key: 'medium', label: lang === 'mn' ? 'Дунд'   : 'Medium' },
    { key: 'hard',   label: lang === 'mn' ? 'Хүнд'   : 'Hard' },
  ];
  const qLabel = lang === 'mn' ? 'асуулт' : 'questions';
  const minLabel = lang === 'mn' ? 'мин' : 'min';
  return (
    <div className="demo-stage">
      <div className="demo-mini-difficulty">
        {cards.map(c => {
          const meta = DIFFICULTY_META[c.key];
          const isSelected = selected === c.key;
          return (
            <button
              key={c.key}
              type="button"
              className={`demo-diff-card ${isSelected ? 'glow' : ''}`}
              onClick={() => onSelect(c.key)}
              aria-pressed={isSelected}
            >
              <div className="demo-diff-label">{c.label}</div>
              <div className="demo-diff-meta mono">
                {meta.questions} {qLabel} · ~{meta.minutes} {minLabel}
              </div>
            </button>
          );
        })}
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

function StepLive({ lang, industry }) {
  const pair = QA[industry]?.[lang] || QA.it[lang] || QA.it.mn;
  return (
    <div className="demo-stage">
      <div className="demo-mini-session">
        <div className="demo-rec">
          <span className="demo-rec-dot" />
          <span className="mono demo-rec-time">00:42</span>
        </div>
        <div className="demo-question">{pair.q}</div>
        <div className="demo-answer-box">
          <Typewriter text={pair.a} />
        </div>
      </div>
    </div>
  );
}

function StepHints({ lang, industry }) {
  const hint = HINTS[industry]?.[lang] || HINTS.it[lang] || HINTS.it.mn;
  const q = lang === 'mn'
    ? 'Багийн ажилд та ямар үүрэг гүйцэтгэдэг вэ?'
    : 'What role do you take on a team?';
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

function StepResults({ lang, industry, difficulty }) {
  const topics = RESULT_TOPICS[industry]?.[lang] || RESULT_TOPICS.it[lang] || RESULT_TOPICS.it.mn;
  const meta = DIFFICULTY_META[difficulty] || DIFFICULTY_META.medium;
  const qLabel = lang === 'mn' ? 'асуулт' : 'q';
  const stats = [
    { k: topics[0], v: 82 },
    { k: topics[1], v: 74 },
    { k: topics[2], v: 80 },
  ];
  return (
    <div className="demo-stage">
      <div className="demo-mini-results">
        <div className="demo-res-row">
          <div className="demo-res-left">
            <div className="label">{lang === 'mn' ? 'Ерөнхий Оноо' : 'Overall Score'}</div>
            <div className="demo-res-score gradient-text mono">
              <ScoreCounter target={78} duration={1400} />
            </div>
            <div className="demo-res-meta mono">{meta.questions} {qLabel}</div>
          </div>
          <div className="demo-res-stats">
            {stats.map(s => (
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

function StepView({
  index, lang, industry, difficulty, onStart,
  onSelectIndustry, onSelectDifficulty, industryToast,
}) {
  switch (index) {
    case 0: return <StepIndustry lang={lang} selected={industry} onSelect={onSelectIndustry} toast={industryToast} />;
    case 1: return <StepDifficulty lang={lang} selected={difficulty} onSelect={onSelectDifficulty} />;
    case 2: return <StepLive lang={lang} industry={industry} />;
    case 3: return <StepHints lang={lang} industry={industry} />;
    case 4: return <StepResults lang={lang} industry={industry} difficulty={difficulty} />;
    case 5: return <StepCta lang={lang} onStart={onStart} />;
    default: return null;
  }
}

/* ---------- Modal ---------- */

function DemoModal({ open, onClose, onStart }) {
  const { lang } = useLang();
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [industry, setIndustry] = useState('it');
  const [difficulty, setDifficulty] = useState('medium');
  const [industryToast, setIndustryToast] = useState('');
  const [holdUntil, setHoldUntil] = useState(0);
  const tickRef = useRef(null);
  const toastTimerRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setElapsed(0);
      setPaused(false);
      setIndustry('it');
      setDifficulty('medium');
      setIndustryToast('');
      setHoldUntil(0);
    }
  }, [open]);

  const onHold = holdUntil > 0 && Date.now() < holdUntil;

  // Tick
  useEffect(() => {
    if (!open || paused || onHold) return;
    tickRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + TICK / 1000;
        return next >= TOTAL ? 0 : next;
      });
    }, TICK);
    return () => clearInterval(tickRef.current);
  }, [open, paused, onHold]);

  // Release the hold once it expires
  useEffect(() => {
    if (!holdUntil) return;
    const remaining = holdUntil - Date.now();
    if (remaining <= 0) { setHoldUntil(0); return; }
    const id = setTimeout(() => setHoldUntil(0), remaining);
    return () => clearTimeout(id);
  }, [holdUntil]);

  // Esc + body scroll lock
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

  // Clean up toast timer on unmount
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const idx = stepIndexFor(elapsed);
  const captions = CAPTIONS[lang] || CAPTIONS.en;
  const progress = (elapsed / TOTAL) * 100;

  function goTo(i) {
    const clamped = Math.max(0, Math.min(STEPS_END.length - 1, i));
    setElapsed(stepStart(clamped));
    setPaused(true);
    setHoldUntil(0);
  }

  function handleStart() {
    onClose?.();
    onStart?.();
  }

  function handleSelectIndustry(key) {
    setIndustry(key);
    const label = lang === 'mn' ? INDUSTRIES[key].mn : INDUSTRIES[key].en;
    setIndustryToast(label);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setIndustryToast(''), 1500);
    setHoldUntil(Date.now() + 3000);
  }

  function handleSelectDifficulty(key) {
    setDifficulty(key);
    setHoldUntil(Date.now() + 3000);
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
                  <StepView
                    index={idx}
                    lang={lang}
                    industry={industry}
                    difficulty={difficulty}
                    onStart={handleStart}
                    onSelectIndustry={handleSelectIndustry}
                    onSelectDifficulty={handleSelectDifficulty}
                    industryToast={industryToast}
                  />
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
