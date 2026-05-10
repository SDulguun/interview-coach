import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronDown, Layers } from 'lucide-react';
import { useLang } from '../lang';
import { classifyQuestion, formatTime } from '../utils';
import { Button, ProgressBar, ScoreCounter } from './ui';
import QuestionBreakdown from './QuestionBreakdown';
import { fetchBreakdown } from '../api';
import './session-results.css';

function cleanMetrics(text) {
  if (!text) return text;
  return text
    .replace(/\(TTR[\s:]*[\d.]+\)/gi, '')
    .replace(/\bTTR[\s:]*[\d.]+/gi, '')
    .replace(/\(WC[\s:]*\d+\)/gi, '')
    .replace(/\bWC[\s:]*\d+/gi, '')
    .replace(/\bfiller[\s:]*[\d.]+%?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function scoreColorClass(score) {
  if (score >= 80) return 'green';
  if (score >= 60) return 'iris';
  return 'amber';
}

const DIM_LABELS = {
  word_count: { mn: 'Тодорхой',    en: 'Clarity' },
  filler:     { mn: 'Цэвэр яриа',  en: 'Fluency' },
  ttr:        { mn: 'Үг баялаг',   en: 'Vocabulary' },
  structure:  { mn: 'STAR бүтэц',  en: 'STAR structure' },
  relevance:  { mn: 'Хамаарал',    en: 'Relevance' },
};

const DIFFICULTY_LABELS = {
  easy:   { mn: 'Хөнгөн', en: 'Easy' },
  medium: { mn: 'Дунд',   en: 'Medium' },
  hard:   { mn: 'Хүнд',   en: 'Hard' },
};

function formatDate(d) {
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins  = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} · ${hours}:${mins}`;
}

function SessionResults({ results, answers, questions = [], totalQuestions, onRestart, onBack, difficulty, jobTitle, userName, sessionId = 'anon', onPracticeQuestion }) {
  const { t, lang } = useLang();
  const [openIndex, setOpenIndex] = useState(null);
  const cacheRef = useRef(new Map());
  const [, forceRender] = useState(0);
  const [prefetch, setPrefetch] = useState({ active: false, done: 0, total: 0 });

  if (!results) return null;

  const { aggregate, per_question, session } = results;
  const score = Math.round(aggregate.overall_score);
  const actualTotal = totalQuestions || questions.length || session?.total_questions || 0;
  const duration = session?.total_duration_seconds || 0;

  const diffLabel = DIFFICULTY_LABELS[difficulty]?.[lang] || DIFFICULTY_LABELS.medium[lang];
  const title = jobTitle
    ? `${jobTitle} · ${diffLabel}`
    : diffLabel;

  const finishedDate = formatDate(new Date());

  const dims = aggregate.dimension_scores || {};
  const dimEntries = Object.entries(dims).slice(0, 4);

  const perQuestionRows = useMemo(() => {
    return (per_question || []).map((result, i) => {
      if (!result) return null;
      const q = questions[i];
      const tag = q ? classifyQuestion(q.question, q.category) : 'general';
      const topic = q?.category
        ? (t(`question_tag_${tag}`) || tag)
        : t(`question_tag_${tag}`);
      const s = Math.round(result.feedback.overall_score);
      return { i, tag, topic, score: s };
    }).filter(Boolean);
  }, [per_question, questions, t]);

  const answerByQuestion = useMemo(() => {
    const map = new Map();
    (answers || []).forEach(a => { if (a?.question) map.set(a.question, a); });
    return map;
  }, [answers]);

  function handleCached(key, value) {
    cacheRef.current.set(key, value);
    forceRender(n => n + 1);
  }

  useEffect(() => {
    function onKey(e) {
      if (openIndex === null) return;
      if (e.key === 'Escape') {
        setOpenIndex(null);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = perQuestionRows.find(r => r.i > openIndex);
        if (next) setOpenIndex(next.i);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = [...perQuestionRows].reverse().find(r => r.i < openIndex);
        if (prev) setOpenIndex(prev.i);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });   // run every render so perQuestionRows in closure is fresh

  function startPrefetch() {
    const tasks = perQuestionRows
      .filter(r => !cacheRef.current.has(`${sessionId}:${r.i}`))
      .map(r => r.i);
    if (tasks.length === 0) return;
    setPrefetch({ active: true, done: 0, total: tasks.length });

    const concurrency = 3;
    let cursor = 0;
    let completed = 0;

    function next() {
      if (cursor >= tasks.length) return Promise.resolve();
      const idx = tasks[cursor++];
      const q = questions[idx];
      const ans = answerByQuestion.get(q?.question);
      if (!q || !ans) {
        completed += 1;
        setPrefetch(p => ({ ...p, done: completed }));
        return next();
      }
      return fetchBreakdown({
        sessionId,
        questionIndex: idx,
        question: q.question,
        userAnswer: ans.text,
        lang,
        sampleAnswer: q.sample_answer || null,
      })
        .then(res => {
          cacheRef.current.set(`${sessionId}:${idx}`, res);
        })
        .catch(err => console.error('prefetch failed:', idx, err))
        .finally(() => {
          completed += 1;
          setPrefetch(p => ({ ...p, done: completed }));
          return next();
        });
    }

    Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, next))
      .then(() => {
        setPrefetch(p => ({ ...p, active: false }));
        forceRender(n => n + 1);
      });
  }

  const allCached = perQuestionRows.length > 0 &&
    perQuestionRows.every(r => cacheRef.current.has(`${sessionId}:${r.i}`));

  const cleanedSuggestions = (aggregate.suggestions || [])
    .map(cleanMetrics)
    .filter(s => s.length > 5)
    .slice(0, 3);

  const cleanedImprovements = (aggregate.improvements || [])
    .map(cleanMetrics)
    .filter(s => s.length > 5);

  const topRecs = cleanedSuggestions.length >= 3
    ? cleanedSuggestions
    : [...cleanedSuggestions, ...cleanedImprovements].slice(0, 3);

  return (
    <div className="results-v3">
      {onBack && (
        <button className="results-back" onClick={onBack} type="button">
          <ArrowLeft size={14} strokeWidth={1.5} />
          {lang === 'mn' ? 'Буцах' : 'Back'}
        </button>
      )}

      {/* ── Top section ── */}
      <header className="results-top">
        <div className="results-top-left">
          <div className="label mono results-date">
            {lang === 'mn' ? 'Дуусгасан · ' : 'Finished · '}{finishedDate}
          </div>
          <h2 className="results-title">{title}</h2>
          <p className="subtle results-subtitle">
            {actualTotal} {lang === 'mn' ? 'асуулт' : 'questions'} · {formatTime(duration)}
            {userName ? ` · ${userName}` : ''}
          </p>
        </div>
        <div className="results-score-wrap">
          <div className="results-score gradient-text">
            <ScoreCounter target={score} duration={1200} suffix="" />
          </div>
          <div className="subtle results-score-label">
            {lang === 'mn' ? 'Ерөнхий Оноо' : 'Overall Score'}
          </div>
        </div>
      </header>

      {/* ── Re-practice comparison banner ── */}
      {session?.repractice && session?.originalScore != null && (() => {
        const orig = Math.round(session.originalScore);
        const newS = Math.round(session.newScore ?? score);
        const delta = newS - orig;
        const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
        return (
          <div className={`results-repractice results-repractice-${dir}`}>
            <span className="results-repractice-label mono">
              {lang === 'mn' ? 'Дахин Дасгал' : 'Re-Practice'}
            </span>
            <span className="results-repractice-compare">
              <span className="muted">
                {lang === 'mn' ? 'Өмнөх Оноо:' : 'Previous:'}
              </span>
              <span className="mono">{orig}</span>
              <ArrowRight size={12} strokeWidth={1.5} />
              <span className="muted">
                {lang === 'mn' ? 'Шинэ Оноо:' : 'New:'}
              </span>
              <span className={`mono ${scoreColorClass(newS)}`}>{newS}</span>
              <span className={`results-repractice-delta mono ${dir}`}>
                {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '±0'}
              </span>
            </span>
          </div>
        );
      })()}

      {/* ── Stats row ── */}
      <section className="results-stats">
        {dimEntries.map(([key, value]) => {
          const v = Math.round(value);
          const cls = scoreColorClass(v);
          const labelPair = DIM_LABELS[key] || { mn: key, en: key };
          return (
            <div key={key} className="stat-card">
              <div className={`stat-value mono ${cls}`}>{v}</div>
              <div className="stat-label">{labelPair[lang] || key}</div>
            </div>
          );
        })}
      </section>

      {/* ── Main grid ── */}
      <section className="results-grid">
        <div className="card results-breakdown">
          <div className="results-breakdown-head">
            <div className="label">
              {lang === 'mn' ? 'Асуулт Тус Бүрийн Задаргаа' : 'Per-Question Breakdown'}
            </div>
            <button
              type="button"
              className="results-prefetch-btn"
              onClick={startPrefetch}
              disabled={prefetch.active || allCached}
            >
              <Layers size={12} strokeWidth={1.5} />
              {allCached
                ? (lang === 'mn' ? 'Бэлэн Боллоо ✓' : 'Ready ✓')
                : prefetch.active
                  ? <span className="mono">{prefetch.done} / {prefetch.total}</span>
                  : (lang === 'mn' ? 'Бүгдийг Ачаалах' : 'Load All')}
            </button>
          </div>
          <div className="results-breakdown-list">
            {perQuestionRows.slice(0, 15).map((row) => {
              const isOpen = openIndex === row.i;
              const q = questions[row.i];
              const ans = answerByQuestion.get(q?.question);
              return (
                <div key={row.i} className={`breakdown-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="breakdown-row breakdown-row-btn"
                    onClick={() => setOpenIndex(isOpen ? null : row.i)}
                    aria-expanded={isOpen}
                  >
                    <span className="mono breakdown-num">{String(row.i + 1).padStart(2, '0')}</span>
                    <span className="breakdown-topic">{row.topic}</span>
                    <ProgressBar
                      value={row.score}
                      score={row.score}
                      width={120}
                      className="breakdown-bar"
                    />
                    <span className={`mono breakdown-score ${scoreColorClass(row.score)}`}>
                      {row.score}
                    </span>
                    <ChevronDown
                      size={14}
                      strokeWidth={1.5}
                      className={`breakdown-chev ${isOpen ? 'open' : ''}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && q && ans && (
                      <QuestionBreakdown
                        sessionId={sessionId}
                        questionIndex={row.i}
                        question={q.question}
                        userAnswer={ans.text}
                        sampleAnswer={q.sample_answer || null}
                        cache={cacheRef.current}
                        onCached={handleCached}
                        onRetry={() => { setOpenIndex(null); setTimeout(() => setOpenIndex(row.i), 0); }}
                        onPracticeAgain={() => {
                          if (onPracticeQuestion) {
                            onPracticeQuestion(q, row.score);
                          } else {
                            onRestart?.();
                          }
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          {perQuestionRows.length > 15 && (
            <button className="btn btn-ghost results-breakdown-more" type="button">
              {lang === 'mn'
                ? `${perQuestionRows.length} асуултыг бүгдийг харах`
                : `View all ${perQuestionRows.length} questions`}
            </button>
          )}
        </div>

        <div className="card results-recs">
          <div className="label">
            {lang === 'mn' ? 'Гол 3 Зөвлөмж' : 'Top 3 Recommendations'}
          </div>
          <ol className="results-recs-list">
            {topRecs.map((rec, idx) => (
              <li key={idx} className="results-rec">
                <span className="results-rec-num mono">{idx + 1}.</span>
                <span className="muted">{rec}</span>
              </li>
            ))}
            {topRecs.length === 0 && (
              <li className="subtle" style={{ padding: '16px 0' }}>
                {lang === 'mn'
                  ? 'Тусгай зөвлөмж алга — хариултууд тань сайн.'
                  : 'No specific suggestions — answers look strong.'}
              </li>
            )}
          </ol>
          <Button onClick={onRestart} style={{ width: '100%', marginTop: 'auto' }}>
            {lang === 'mn' ? 'Дахин дасгал хийе' : 'Practice Again'}
            <ArrowRight size={14} strokeWidth={1.5} />
          </Button>
        </div>
      </section>
    </div>
  );
}

export default SessionResults;
