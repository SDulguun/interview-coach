import { useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLang } from '../lang';
import { classifyQuestion, formatTime } from '../utils';
import { Button, ProgressBar, ScoreCounter } from './ui';
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

function SessionResults({ results, answers, questions = [], totalQuestions, onRestart, onBack, difficulty, jobTitle, userName }) {
  const { t, lang } = useLang();

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
            {lang === 'mn' ? 'Ерөнхий оноо' : 'Overall score'}
          </div>
        </div>
      </header>

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
          <div className="label">
            {lang === 'mn' ? 'Асуулт тус бүрийн задаргаа' : 'Per-question breakdown'}
          </div>
          <div className="results-breakdown-list">
            {perQuestionRows.slice(0, 15).map((row) => (
              <div key={row.i} className="breakdown-row">
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
              </div>
            ))}
          </div>
          {perQuestionRows.length > 15 && (
            <button className="btn btn-ghost results-breakdown-more" type="button">
              {lang === 'mn'
                ? `Бүх ${perQuestionRows.length} асуулт харах`
                : `View all ${perQuestionRows.length} questions`}
            </button>
          )}
        </div>

        <div className="card results-recs">
          <div className="label">
            {lang === 'mn' ? 'Гол 3 зөвлөмж' : 'Top 3 recommendations'}
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
                  ? 'Тусгай зөвлөмж алга — хариултууд нийцсэн байна.'
                  : 'No specific suggestions — answers look strong.'}
              </li>
            )}
          </ol>
          <Button onClick={onRestart} style={{ width: '100%', marginTop: 'auto' }}>
            {lang === 'mn' ? 'Дахин дасгал хий' : 'Practice again'}
            <ArrowRight size={14} strokeWidth={1.5} />
          </Button>
        </div>
      </section>
    </div>
  );
}

export default SessionResults;
