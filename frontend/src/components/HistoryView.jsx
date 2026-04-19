import { useLang } from '../lang';
import ProgressChart from './ProgressChart';
import SessionHistory from './SessionHistory';
import illustAnalytics from '../assets/illust-analytics.jpg';

function HistoryView({ onStartNew }) {
  const { t } = useLang();

  return (
    <div className="history-view">
      <div className="history-view-header">
        <div className="history-header-row">
          <div>
            <h2>{t('nav_history')}</h2>
            <p>{t('history_view_desc')}</p>
          </div>
          <img src={illustAnalytics} alt="" className="history-header-illustration" />
        </div>
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
