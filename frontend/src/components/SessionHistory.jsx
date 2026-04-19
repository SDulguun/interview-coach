import { useState } from 'react';
import { useLang } from '../lang';
import { formatTime, getScoreColor } from '../utils';
import { getCurrentUser, userKey } from '../auth';

function SessionHistory() {
  const { t, lang } = useLang();
  const user = getCurrentUser();
  const histKey = userKey(user?.id, 'history');
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(histKey) || '[]');
    } catch {
      return [];
    }
  });
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (history.length === 0) return null;

  function clearHistory() {
    localStorage.removeItem(histKey);
    setHistory([]);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function toggleExpand(i) {
    setExpandedIndex(expandedIndex === i ? null : i);
  }

  function getScoreColorVar(score) {
    if (score >= 80) return 'var(--green)';
    if (score >= 60) return 'var(--yellow)';
    return 'var(--red)';
  }

  return (
    <div className="card session-history">
      <div className="history-header">
        <h2>{t('history_title')}</h2>
        <button className="btn btn-secondary btn-sm" onClick={clearHistory}>
          {t('history_clear')}
        </button>
      </div>
      <div className="history-list">
        {history.map((item, i) => {
          const isExpanded = expandedIndex === i;
          const hasDetail = item.questions && item.answers && item.results;
          return (
            <div key={i} className={`history-item-wrapper ${isExpanded ? 'expanded' : ''}`}>
              <div
                className="history-item"
                onClick={() => hasDetail && toggleExpand(i)}
                style={{ cursor: hasDetail ? 'pointer' : 'default' }}
              >
                <div className="history-info">
                  <span className="history-date">{formatDate(item.date)}</span>
                  <div className="history-meta-row">
                    {item.category && <span className="history-category">{item.category}</span>}
                    {item.questionsAnswered && (
                      <span className="history-meta">{item.questionsAnswered}/{item.totalQuestions || 15} {t('history_questions_count')}</span>
                    )}
                    {item.duration > 0 && (
                      <span className="history-meta">{formatTime(item.duration)}</span>
                    )}
                  </div>
                </div>
                <div className="history-score-section">
                  <span className="history-score" style={{ color: getScoreColorVar(item.score) }}>
                    {item.score}%
                  </span>
                  {hasDetail && (
                    <svg className={`history-expand-icon ${isExpanded ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  )}
                </div>
              </div>

              {/* Detail panel */}
              {isExpanded && hasDetail && (
                <div className="history-detail">
                  {/* Dimension scores */}
                  {item.results.aggregate?.dimension_scores && (
                    <div className="history-detail-section">
                      <div className="history-dimension-bars">
                        {Object.entries(item.results.aggregate.dimension_scores).map(([key, val]) => {
                          const v = Math.round(val);
                          return (
                            <div key={key} className="history-dim-row">
                              <span className="history-dim-label">{key}</span>
                              <div className="history-dim-track">
                                <div className="history-dim-fill" style={{ width: `${v}%`, backgroundColor: getScoreColor(v) }} />
                              </div>
                              <span className="history-dim-val" style={{ color: getScoreColor(v) }}>{v}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Per-question breakdown */}
                  <div className="history-detail-section">
                    <h4>{t('per_question')}</h4>
                    {item.questions.map((q, qi) => {
                      const ans = item.answers[qi];
                      const pq = item.results.per_question?.[qi];
                      const qScore = pq ? Math.round(pq.feedback.overall_score) : null;
                      return (
                        <div key={qi} className="history-q-item">
                          <div className="history-q-header">
                            <span className="history-q-num">{t('q_prefix')}{qi + 1}</span>
                            <span className="history-q-text">{q.question.slice(0, 80)}{q.question.length > 80 ? '...' : ''}</span>
                            {qScore !== null && (
                              <span className="history-q-score" style={{ color: getScoreColor(qScore) }}>{qScore}%</span>
                            )}
                          </div>
                          {ans?.text && (
                            <p className="history-q-answer">{ans.text.slice(0, 200)}{ans.text.length > 200 ? '...' : ''}</p>
                          )}
                          {pq?.feedback?.improvements?.length > 0 && (
                            <p className="history-q-improvement">{pq.feedback.improvements[0]}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Strengths / improvements */}
                  {(item.results.aggregate?.strengths?.length > 0 || item.results.aggregate?.improvements?.length > 0) && (
                    <div className="history-detail-section history-feedback-row">
                      {item.results.aggregate.strengths?.length > 0 && (
                        <div className="history-feedback-col">
                          <h4>{t('strengths')}</h4>
                          <ul>{item.results.aggregate.strengths.slice(0, 3).map((s, si) => <li key={si}>{s}</li>)}</ul>
                        </div>
                      )}
                      {item.results.aggregate.improvements?.length > 0 && (
                        <div className="history-feedback-col">
                          <h4>{t('improvements')}</h4>
                          <ul>{item.results.aggregate.improvements.slice(0, 3).map((s, si) => <li key={si}>{s}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SessionHistory;
