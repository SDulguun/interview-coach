import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowUpRight, Mic, RotateCcw } from 'lucide-react';
import { useLang } from '../lang';
import { fetchBreakdown } from '../api';

const SUB_LABELS = {
  clarity:   { mn: 'Тодорхой',   en: 'Clarity' },
  structure: { mn: 'STAR бүтэц', en: 'STAR structure' },
  pace:      { mn: 'Хурд',       en: 'Pace' },
  relevance: { mn: 'Хамаарал',   en: 'Relevance' },
};

function colorFor(score) {
  if (score >= 80) return 'green';
  if (score >= 60) return 'iris';
  return 'amber';
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function Skeleton() {
  return (
    <div className="qb-skeleton">
      <div className="qb-sk-row qb-sk-row-lg glow-pulse" />
      <div className="qb-sk-row glow-pulse" />
      <div className="qb-sk-row qb-sk-row-md glow-pulse" />
      <div className="qb-sk-grid">
        <div className="qb-sk-tile glow-pulse" />
        <div className="qb-sk-tile glow-pulse" />
        <div className="qb-sk-tile glow-pulse" />
        <div className="qb-sk-tile glow-pulse" />
      </div>
      <div className="qb-sk-row qb-sk-row-md glow-pulse" />
      <div className="qb-sk-row qb-sk-row-md glow-pulse" />
    </div>
  );
}

function QuestionBreakdown({
  sessionId,
  questionIndex,
  question,
  userAnswer,
  sampleAnswer,
  durationSeconds = 0,
  wasVoice = false,
  cache,
  onCached,
  onRetry,
  onPracticeAgain,
}) {
  const { lang } = useLang();
  const cached = cache?.get(`${sessionId}:${questionIndex}`);
  const [data, setData] = useState(cached || null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cached) { setData(cached); setLoading(false); setError(''); return; }
    let alive = true;
    setLoading(true); setError('');
    fetchBreakdown({
      sessionId, questionIndex, question, userAnswer,
      lang, durationSeconds, wasVoice, sampleAnswer,
    })
      .then((res) => {
        if (!alive) return;
        setData(res);
        onCached?.(`${sessionId}:${questionIndex}`, res);
      })
      .catch((e) => {
        if (!alive) return;
        console.error('breakdown failed:', e);
        setError(lang === 'mn' ? 'Дэлгэрэнгүйг ачаалж чадсангүй.' : 'Could not load the breakdown.');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [sessionId, questionIndex]);   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="qb-panel"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ overflow: 'hidden' }}
    >
      <div className="qb-inner">
        {loading && <Skeleton />}

        {error && !loading && (
          <div className="qb-error">
            <span>{error}</span>
            <button type="button" onClick={() => onRetry?.()}>
              {lang === 'mn' ? 'Дахин Оролдох' : 'Try Again'}
            </button>
          </div>
        )}

        {data && !loading && !error && (
          <>
            {/* 1. Original question */}
            <section className="qb-sec">
              <div className="label">{lang === 'mn' ? 'Асуулт' : 'Question'}</div>
              <p className="qb-question">{data.question}</p>
            </section>

            {/* 2. User's answer */}
            <section className="qb-sec">
              <div className="qb-sec-head">
                <span className="label">{lang === 'mn' ? 'Таны Хариулт' : 'Your Answer'}</span>
                <span className="mono qb-meta">
                  {data.word_count} {lang === 'mn' ? 'үг' : 'words'} · {formatDuration(data.duration_seconds)}
                </span>
              </div>
              {data.was_voice && (
                <span className="qb-voice-tag">
                  <Mic size={12} strokeWidth={1.5} />
                  {lang === 'mn' ? 'Бичлэгээс хөрвүүлсэн' : 'Transcribed from voice'}
                </span>
              )}
              <div className="qb-answer-block">{data.user_answer}</div>
            </section>

            {/* 3. Score breakdown */}
            <section className="qb-sec">
              <div className="label">{lang === 'mn' ? 'Үнэлгээ' : 'Scores'}</div>
              <div className="qb-scores">
                {Object.entries(data.scores).map(([key, val]) => {
                  const cls = colorFor(val);
                  return (
                    <div key={key} className="qb-score-tile">
                      <div className="qb-score-label">
                        {SUB_LABELS[key]?.[lang] || key}
                      </div>
                      <div className={`qb-score-num mono ${cls}`}>{val}</div>
                      <div className="progress-bar qb-score-bar">
                        <div className={`progress-bar-fill ${cls === 'iris' ? '' : cls}`} style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 4. Strengths */}
            <section className="qb-sec">
              <div className="label">{lang === 'mn' ? 'Сайн Хийсэн Зүйл' : 'What Went Well'}</div>
              <ul className="qb-bullets">
                {data.strengths.map((s, i) => (
                  <li key={i} className="qb-bullet">
                    <span className="qb-icon-circle qb-icon-green">
                      <Check size={12} strokeWidth={2} />
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 5. Improvements */}
            <section className="qb-sec">
              <div className="label">{lang === 'mn' ? 'Сайжруулах Боломж' : 'What to Improve'}</div>
              <ul className="qb-bullets">
                {data.improvements.map((s, i) => (
                  <li key={i} className="qb-bullet">
                    <span className="qb-icon-circle qb-icon-amber">
                      <ArrowUpRight size={12} strokeWidth={2} />
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 6. Sample answers */}
            <section className="qb-sec">
              <div className="label">
                {lang === 'mn' ? 'Жишээ Хариулт' : 'Sample Answers'}
                <span className="qb-source-badge">
                  {data.source === 'llm'
                    ? (lang === 'mn' ? 'AI' : 'AI')
                    : (lang === 'mn' ? 'Загвар' : 'Template')}
                </span>
              </div>
              <div className="qb-samples">
                {data.sample_answers.map((sa, i) => (
                  <div key={i} className="qb-sample">
                    <span className={`qb-sample-tag ${sa.quality === 'best' ? 'qb-tag-green' : 'qb-tag-iris'}`}>
                      {sa.quality === 'best'
                        ? (lang === 'mn' ? 'Хамгийн Сайн' : 'Best')
                        : (lang === 'mn' ? 'Илүү Сайн' : 'Better')}
                    </span>
                    <p className="qb-sample-text">{sa.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Practice again */}
            <button type="button" className="qb-practice-btn" onClick={() => onPracticeAgain?.(questionIndex)}>
              <RotateCcw size={14} strokeWidth={1.5} />
              {lang === 'mn' ? 'Энэ асуултыг дахин хариулъя' : 'Practice this question again'}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default QuestionBreakdown;
