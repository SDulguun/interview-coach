import { useLang } from '../lang';
import SetupTabs from './SetupTabs';
import ProgressChart from './ProgressChart';
import SessionHistory from './SessionHistory';

function Dashboard({
  selectedJob,
  onJobChange,
  onJobDescription,
  onResumeSkills,
  onStartInterview,
  loading,
}) {
  const { t } = useLang();

  return (
    <div className="dashboard">
      {/* Getting Started */}
      <div className="getting-started">
        <h2>{t('getting_started')}</h2>
        <p>{t('getting_started_desc')}</p>
        <div className="step-cards">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>{t('step1_title')}</h3>
            <p>{t('step1_desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>{t('step2_title')}</h3>
            <p>{t('step2_desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>{t('step3_title')}</h3>
            <p>{t('step3_desc')}</p>
          </div>
        </div>
      </div>

      {/* Setup Tabs (Quick Start / Customize) */}
      <SetupTabs
        selectedJob={selectedJob}
        onJobChange={onJobChange}
        onJobDescription={onJobDescription}
        onResumeSkills={onResumeSkills}
      />

      {/* Progress + History side by side */}
      <div className="dashboard-grid">
        <ProgressChart />
        <SessionHistory />
      </div>

      {/* Start Button */}
      <div className="start-section">
        <button
          className="btn btn-primary start-btn"
          onClick={onStartInterview}
          disabled={loading}
        >
          {loading ? t('btn_loading') : t('btn_start')}
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
