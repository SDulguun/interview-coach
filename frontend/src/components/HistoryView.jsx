import { useLang } from '../lang';
import ProgressChart from './ProgressChart';
import SessionHistory from './SessionHistory';

function HistoryView({ onStartNew }) {
  const { t } = useLang();

  return (
    <div className="history-view">
      <div className="history-view-header">
        <h2>{t('nav_history')}</h2>
        <p>{t('history_view_desc')}</p>
      </div>
      <ProgressChart />
      <SessionHistory />
      <div className="history-view-cta">
        <button className="btn btn-primary" onClick={onStartNew}>
          {t('btn_new_session')}
        </button>
      </div>
    </div>
  );
}

export default HistoryView;
