import { useState } from 'react';
import ScoreCard from './ScoreCard';
import { useLang } from '../lang';

function SessionResults({ results, answers, questions = [], onRestart }) {
  const { t } = useLang();
  const [expandedSample, setExpandedSample] = useState({});

  const SCORE_LABELS = {
    word_count: t('score_word_count'),
    filler: t('score_filler'),
    ttr: t('score_ttr'),
    structure: t('score_structure'),
    relevance: t('score_relevance'),
  };

  if (!results) return null;

  const { aggregate, per_question, session } = results;

  function getOverallColor(value) {
    if (value >= 80) return 'var(--green)';
    if (value >= 60) return 'var(--yellow)';
    return 'var(--red)';
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="session-results">
      {/* Overall Score */}
      <div className="card results-header">
        <h2>{t('results_title')}</h2>
        <div className="session-stats">
          <span>{session.answered} / {session.total_questions} {t('questions_answered')}</span>
          <span>{formatTime(session.total_duration_seconds)} {t('total_time')}</span>
        </div>
        <div className="overall-score">
          <div
            className="score-value"
            style={{ color: getOverallColor(aggregate.overall_score) }}
          >
            {Math.round(aggregate.overall_score)}
          </div>
          <div className="score-label">{t('overall_score')}</div>
        </div>

        <div className="score-grid">
          {Object.entries(aggregate.dimension_scores).map(([key, value]) => (
            <ScoreCard
              key={key}
              label={SCORE_LABELS[key] || key}
              score={value}
            />
          ))}
        </div>
      </div>

      {/* Aggregate Feedback */}
      <div className="card feedback-panel">
        <h2>{t('key_feedback')}</h2>

        {aggregate.strengths.length > 0 && (
          <div className="feedback-section feedback-strengths">
            <h3>{t('strengths')}</h3>
            <ul>
              {aggregate.strengths.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {aggregate.improvements.length > 0 && (
          <div className="feedback-section feedback-improvements">
            <h3>{t('improvements')}</h3>
            <ul>
              {aggregate.improvements.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {aggregate.suggestions.length > 0 && (
          <div className="feedback-section feedback-suggestions">
            <h3>{t('suggestions')}</h3>
            <ul>
              {aggregate.suggestions.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Per-question breakdown */}
      <div className="card">
        <h2>{t('per_question')}</h2>
        {per_question.map((result, i) => {
          if (!result) return null;
          const answer = answers[i];
          return (
            <div key={i} className="question-result">
              <div className="question-result-header">
                <span className="question-number">{t('q_prefix')}{i + 1}</span>
                <span className="question-score" style={{ color: getOverallColor(result.feedback.overall_score) }}>
                  {Math.round(result.feedback.overall_score)}
                </span>
              </div>
              <p className="question-text-small">{answer?.question}</p>
              <p className="answer-text-small">{answer?.text}</p>
              {result.feedback.improvements.length > 0 && (
                <p className="improvement-hint">{result.feedback.improvements[0]}</p>
              )}
              {questions[i]?.sample_answer && (
                <div className="sample-answer-section">
                  <button
                    className="sample-answer-toggle"
                    onClick={() => setExpandedSample(prev => ({ ...prev, [i]: !prev[i] }))}
                  >
                    {t('sample_answer')} {expandedSample[i] ? '▲' : '▼'}
                  </button>
                  {expandedSample[i] && (
                    <p className="sample-answer-text">{questions[i].sample_answer}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button className="btn btn-secondary" onClick={() => window.print()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
          {t('btn_export_pdf')}
        </button>
        <button className="btn btn-primary" onClick={onRestart}>
          {t('btn_new_session')}
        </button>
      </div>
    </div>
  );
}

export default SessionResults;
