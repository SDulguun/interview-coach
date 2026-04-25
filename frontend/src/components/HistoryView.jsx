import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  Cell,
} from 'recharts';
import { ChevronDown, Trash2 } from 'lucide-react';
import { useLang } from '../lang';
import { getCurrentUser, userKey } from '../auth';
import { formatTime } from '../utils';
import { StatCard } from './ui';
import './history-view.css';

function scoreClass(s) {
  if (s == null) return '';
  if (s >= 80) return 'green';
  if (s >= 60) return 'iris';
  return 'amber';
}

function scoreToken(s) {
  if (s == null) return 'var(--text-faint)';
  if (s >= 80) return 'var(--green)';
  if (s >= 60) return 'var(--iris-300)';
  return 'var(--amber)';
}

function formatDateShort(iso) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}.${dd} ${hh}:${mi}`;
}

function formatHoursMin(totalSec, lang) {
  if (!totalSec || totalSec <= 0) return '—';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (lang === 'mn') return h > 0 ? `${h}ц ${m}м` : `${m}м`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="history-tt">
      <div className="history-tt-date mono">{label}</div>
      <div className="history-tt-row">
        <span className="history-tt-label">Score</span>
        <span className="history-tt-val mono" style={{ color: scoreToken(p.score) }}>{p.score}</span>
      </div>
      {p.difficulty && (
        <div className="history-tt-row">
          <span className="history-tt-label">Difficulty</span>
          <span className="history-tt-val">{p.difficulty}</span>
        </div>
      )}
    </div>
  );
}

function ProgressChartBlock({ history, lang }) {
  const { t } = useLang();

  if (history.length < 2) {
    const dummy = [
      { x: 1, y: 55 }, { x: 2, y: 62 }, { x: 3, y: 70 }, { x: 4, y: 78 },
    ];
    return (
      <div className="history-card">
        <h3 className="history-card-title">{t('progress_title')}</h3>
        <div className="history-empty-chart">
          <svg viewBox="0 0 200 80" className="history-sparkline">
            <polyline
              points={dummy.map((p, i) => `${i * 60 + 10},${80 - p.y * 0.7}`).join(' ')}
              fill="none"
              stroke="var(--ink-600)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {dummy.map((p, i) => (
              <circle key={i} cx={i * 60 + 10} cy={80 - p.y * 0.7} r="3" fill="var(--ink-600)" />
            ))}
          </svg>
          <p className="history-empty-text">{t('progress_empty')}</p>
        </div>
      </div>
    );
  }

  const chartData = [...history].reverse().map((it) => ({
    date: formatDateShort(it.date).split(' ')[0],
    score: Math.round(it.score),
    difficulty: it.difficulty || '',
  }));

  return (
    <div className="history-card">
      <h3 className="history-card-title">{t('progress_title')}</h3>
      <div className="history-chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 12, right: 16, bottom: 4, left: -12 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="var(--text-faint)"
              tick={{ fill: 'var(--text-faint)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              stroke="var(--text-faint)"
              tick={{ fill: 'var(--text-faint)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(167,139,250,0.2)' }} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--iris-500)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--iris-500)', stroke: 'var(--ink-900)', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: 'var(--iris-300)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopicBreakdownBlock({ history, lang }) {
  const data = useMemo(() => {
    const totals = {};
    history.forEach((sess) => {
      const dims = sess.results?.aggregate?.dimension_scores || {};
      Object.entries(dims).forEach(([k, v]) => {
        if (!totals[k]) totals[k] = { total: 0, count: 0 };
        totals[k].total += Number(v) || 0;
        totals[k].count += 1;
      });
    });
    return Object.entries(totals)
      .map(([k, v]) => ({ topic: k, score: Math.round(v.total / v.count) }))
      .sort((a, b) => b.score - a.score);
  }, [history]);

  if (data.length === 0) return null;

  return (
    <div className="history-card">
      <h3 className="history-card-title">
        {lang === 'mn' ? 'Сэдвийн хүчтэй / сул талууд' : 'Strengths and weaknesses by topic'}
      </h3>
      <div className="history-chart-wrap" style={{ height: data.length * 36 + 28 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              stroke="var(--text-faint)"
              tick={{ fill: 'var(--text-faint)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="topic"
              type="category"
              stroke="var(--text-subtle)"
              tick={{ fill: 'var(--text-subtle)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip
              cursor={{ fill: 'rgba(167,139,250,0.06)' }}
              contentStyle={{
                background: 'var(--ink-700)',
                border: '0.5px solid var(--border-card)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: 'var(--text-primary)' }}
              itemStyle={{ color: 'var(--text-body)' }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((d, i) => (
                <Cell key={i} fill={scoreToken(d.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SessionsListBlock({ history, onClear, lang }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(null);

  function handleClear() {
    const msg = lang === 'mn'
      ? 'Бүх түүх устгах уу? Энэ үйлдлийг буцаах боломжгүй.'
      : 'Clear all history? This cannot be undone.';
    if (window.confirm(msg)) onClear();
  }

  if (history.length === 0) {
    return (
      <div className="history-card">
        <div className="history-card-head">
          <h3 className="history-card-title">{t('history_title')}</h3>
        </div>
        <p className="history-empty-text" style={{ paddingLeft: 0 }}>
          {lang === 'mn' ? 'Одоогоор ярилцлага байхгүй байна.' : 'No interview sessions yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="history-card">
      <div className="history-card-head">
        <h3 className="history-card-title">{t('history_title')}</h3>
        <button className="history-clear-btn" onClick={handleClear} type="button">
          <Trash2 size={13} strokeWidth={1.5} />
          {t('history_clear')}
        </button>
      </div>

      <div className="history-list">
        {history.map((item, i) => {
          const isOpen = expanded === i;
          const hasDetail = item.questions && item.answers && item.results;
          const score = Math.round(item.score);
          return (
            <div key={i} className={`history-row-wrap ${isOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="history-row"
                onClick={() => hasDetail && setExpanded(isOpen ? null : i)}
                disabled={!hasDetail}
              >
                <span className="history-row-date mono">{formatDateShort(item.date)}</span>
                <span className="history-row-meta">
                  {item.category && <span className="history-row-cat">{item.category}</span>}
                  {item.questionsAnswered != null && (
                    <span className="history-row-q">
                      {item.questionsAnswered}/{item.totalQuestions || 15} {t('history_questions_count')}
                    </span>
                  )}
                </span>
                <span className="history-row-dur mono">
                  {item.duration > 0 ? formatTime(item.duration) : '—'}
                </span>
                <span className={`history-row-score mono ${scoreClass(score)}`}>{score}</span>
                {hasDetail && (
                  <ChevronDown
                    size={14}
                    strokeWidth={1.5}
                    className={`history-row-chev ${isOpen ? 'open' : ''}`}
                  />
                )}
              </button>

              {isOpen && hasDetail && (
                <div className="history-row-detail">
                  {item.results.aggregate?.dimension_scores && (
                    <div className="history-detail-dims">
                      {Object.entries(item.results.aggregate.dimension_scores).map(([k, v]) => {
                        const val = Math.round(Number(v));
                        return (
                          <div key={k} className="history-dim-row">
                            <span className="history-dim-label">{k}</span>
                            <div className="history-dim-track">
                              <div
                                className="history-dim-fill"
                                style={{ width: `${val}%`, background: scoreToken(val) }}
                              />
                            </div>
                            <span className="history-dim-val mono" style={{ color: scoreToken(val) }}>
                              {val}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {item.results.aggregate?.improvements?.length > 0 && (
                    <div className="history-detail-bullets">
                      <div className="label">{t('improvements')}</div>
                      <ul>
                        {item.results.aggregate.improvements.slice(0, 3).map((s, si) => (
                          <li key={si}>{s}</li>
                        ))}
                      </ul>
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

function HistoryView({ onStartNew }) {
  const { t, lang } = useLang();
  const user = getCurrentUser();
  const histKey = userKey(user?.id, 'history');

  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(histKey) || '[]'); }
    catch { return []; }
  });

  const stats = useMemo(() => {
    if (history.length === 0) {
      return { count: 0, avg: null, best: null, totalSec: 0 };
    }
    const scores = history.map((h) => Math.round(h.score)).filter((n) => Number.isFinite(n));
    const totalSec = history.reduce((acc, h) => acc + (h.duration || 0), 0);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const best = scores.length ? Math.max(...scores) : null;
    return { count: history.length, avg, best, totalSec };
  }, [history]);

  function handleClear() {
    localStorage.removeItem(histKey);
    setHistory([]);
  }

  return (
    <div className="history-view-v2">
      <header className="history-view-header">
        <h2>{t('nav_history')}</h2>
        <p className="subtle">{t('history_view_desc')}</p>
      </header>

      <div className="history-stats">
        <StatCard
          value={stats.count || '—'}
          label={lang === 'mn' ? 'Нийт дасгал' : 'Total sessions'}
          mono
        />
        <StatCard
          value={stats.avg != null ? stats.avg : '—'}
          label={lang === 'mn' ? 'Дундаж оноо' : 'Average score'}
          color={scoreClass(stats.avg)}
          mono
        />
        <StatCard
          value={stats.best != null ? stats.best : '—'}
          label={lang === 'mn' ? 'Шилдэг оноо' : 'Best score'}
          color={scoreClass(stats.best)}
          mono
        />
        <StatCard
          value={formatHoursMin(stats.totalSec, lang)}
          label={lang === 'mn' ? 'Нийт цаг' : 'Total time'}
          mono
        />
      </div>

      <ProgressChartBlock history={history} lang={lang} />
      <TopicBreakdownBlock history={history} lang={lang} />
      <SessionsListBlock history={history} onClear={handleClear} lang={lang} />

      <div className="history-cta">
        <button className="btn btn-primary" onClick={onStartNew}>
          {t('btn_new_session')}
        </button>
      </div>
    </div>
  );
}

export default HistoryView;
