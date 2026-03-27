import { useState } from 'react';
import { useLang } from '../lang';

function SessionHistory() {
  const { t } = useLang();
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('interview-history') || '[]');
    } catch {
      return [];
    }
  });

  if (history.length === 0) return null;

  function clearHistory() {
    localStorage.removeItem('interview-history');
    setHistory([]);
  }

  function getScoreColor(score) {
    if (score >= 80) return 'var(--green)';
    if (score >= 60) return 'var(--yellow)';
    return 'var(--red)';
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
        {history.map((item, i) => (
          <div key={i} className="history-item">
            <div className="history-info">
              <span className="history-date">{formatDate(item.date)}</span>
              {item.category && <span className="history-category">{item.category}</span>}
            </div>
            <span className="history-score" style={{ color: getScoreColor(item.score) }}>
              {item.score} {t('history_score')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SessionHistory;
