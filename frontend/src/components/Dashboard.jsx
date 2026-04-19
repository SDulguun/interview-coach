import { useState } from 'react';
import { useLang } from '../lang';
import SetupTabs from './SetupTabs';
import illustResume from '../assets/illust-resume-pencil.jpg';

function Dashboard({
  selectedJob,
  onJobChange,
  onJobDescription,
  onResumeSkills,
  onStartInterview,
  loading,
  difficulty,
  onDifficultyChange,
  userName,
  onUserNameChange,
}) {
  const { t, lang } = useLang();
  const [setupStep, setSetupStep] = useState(0); // 0=info, 1=category, 2=mode, 3=summary

  const steps = [
    { key: 'info', label: t('step_info') },
    { key: 'category', label: t('step_category') },
    { key: 'mode', label: t('step_mode') },
    { key: 'ready', label: t('step_ready') },
  ];

  const difficultyModes = [
    {
      key: 'easy',
      label: t('difficulty_easy'),
      desc: lang === 'mn'
        ? 'Энгийн асуултууд, ерөнхий ярилцлагын бүтэц. Эхлэн суралцагчдад тохиромжтой.'
        : 'Straightforward questions, standard structure. Good for beginners.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      ),
    },
    {
      key: 'medium',
      label: t('difficulty_medium'),
      desc: lang === 'mn'
        ? 'Жинхэнэ ярилцлагатай адил түвшин. Туршлага, жишээ шаарддаг асуултууд.'
        : 'Real interview level. Requires examples and structured answers.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
        </svg>
      ),
      recommended: true,
    },
    {
      key: 'hard',
      label: t('difficulty_hard'),
      desc: lang === 'mn'
        ? 'Гүнзгий мэргэжлийн, нөхцөл байдлын шинжилгээ, удирдлагын асуултууд.'
        : 'Deep technical, scenario analysis, and leadership questions.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
    },
  ];

  const active = difficultyModes.find(m => m.key === difficulty) || difficultyModes[1];

  const [categoryError, setCategoryError] = useState(false);

  function canProceed() {
    if (setupStep === 0) return userName.trim().length > 0;
    if (setupStep === 1) return !!selectedJob;
    return true;
  }

  function nextStep() {
    if (!canProceed()) {
      if (setupStep === 1) setCategoryError(true);
      return;
    }
    setCategoryError(false);
    if (setupStep < steps.length - 1) setSetupStep(setupStep + 1);
  }

  function prevStep() {
    if (setupStep > 0) setSetupStep(setupStep - 1);
  }

  return (
    <div className="setup-page">
      {/* Step Indicator */}
      <div className="step-indicator">
        {steps.map((step, i) => (
          <div key={step.key} className={`step-item ${i === setupStep ? 'active' : ''} ${i < setupStep ? 'done' : ''}`}>
            <div className="step-dot">
              {i < setupStep ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <span className="step-label">{step.label}</span>
            {i < steps.length - 1 && <div className="step-line" />}
          </div>
        ))}
      </div>

      {/* Step 0: User Info */}
      {setupStep === 0 && (
        <div className="card setup-step-card">
          <h2>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {t('step_info')}
          </h2>
          <p className="setup-step-desc">
            {lang === 'mn'
              ? 'Ярилцлагын дасгалд тавтай морил. Нэрээ оруулаад эхлүүлээрэй.'
              : 'Welcome to interview practice. Enter your name to begin.'}
          </p>
          <div className="user-info-field">
            <label>{t('user_name')}</label>
            <input
              type="text"
              className="user-name-input"
              placeholder={t('user_name_placeholder')}
              value={userName}
              onChange={(e) => onUserNameChange(e.target.value)}
              autoFocus
            />
            <span className="user-info-hint">{t('user_name_hint')}</span>
          </div>
          <div className="step-actions">
            <div />
            <button className="btn btn-primary" onClick={nextStep} disabled={!canProceed()}>
              {t('next_step')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Category Selection */}
      {setupStep === 1 && (
        <div className="setup-step-card">
          <SetupTabs
            selectedJob={selectedJob}
            onJobChange={(job) => { setCategoryError(false); onJobChange(job); }}
            onJobDescription={onJobDescription}
            onResumeSkills={onResumeSkills}
          />
          {categoryError && (
            <p className="category-error">
              {lang === 'mn' ? 'Салбар сонгоно уу' : 'Please select a category'}
            </p>
          )}
          <div className="step-actions">
            <button className="btn btn-secondary" onClick={prevStep}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              {t('prev_step')}
            </button>
            <button className="btn btn-primary" onClick={nextStep}>
              {t('next_step')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Difficulty Level */}
      {setupStep === 2 && (
        <div className="card setup-step-card">
          <h2>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
            {t('difficulty_title')}
          </h2>
          <p className="setup-step-desc">
            {lang === 'mn'
              ? 'Бүх горим 15 асуулттай бүрэн ярилцлага. Түвшин нь асуултын нарийвчлалд нөлөөлнө.'
              : 'All levels are full 15-question interviews. Difficulty affects question depth.'}
          </p>
          <div className="session-mode-grid">
            {difficultyModes.map((mode) => (
              <button
                key={mode.key}
                className={`session-mode-card ${difficulty === mode.key ? 'active' : ''}`}
                onClick={() => onDifficultyChange(mode.key)}
              >
                {mode.recommended && (
                  <span className="session-mode-badge">
                    {lang === 'mn' ? 'Санал болгох' : 'Recommended'}
                  </span>
                )}
                <span className="session-mode-icon">{mode.icon}</span>
                <span className="session-mode-label">{mode.label}</span>
                <span className="session-mode-desc">{mode.desc}</span>
                <span className="session-mode-time">15 {lang === 'mn' ? 'асуулт' : 'questions'} · ~25 {t('minutes')}</span>
              </button>
            ))}
          </div>
          <div className="step-actions">
            <button className="btn btn-secondary" onClick={prevStep}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              {t('prev_step')}
            </button>
            <button className="btn btn-primary" onClick={nextStep}>
              {t('next_step')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Summary + Start */}
      {setupStep === 3 && (
        <div className="card setup-step-card setup-summary">
          <img src={illustResume} alt="" className="setup-summary-illustration" />
          <div className="setup-summary-header">
            <h2>{lang === 'mn' ? 'Дасгалын тойм' : 'Session Summary'}</h2>
          </div>

          <div className="setup-summary-grid">
            <div className="summary-stat">
              <svg className="summary-stat-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span className="summary-stat-value">{userName}</span>
              <span className="summary-stat-label">{t('user_name')}</span>
            </div>
            <div className="summary-stat">
              <svg className="summary-stat-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span className="summary-stat-value">15</span>
              <span className="summary-stat-label">{t('progress')}</span>
            </div>
            <div className="summary-stat">
              <svg className="summary-stat-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
              <span className="summary-stat-value">{active.label}</span>
              <span className="summary-stat-label">{t('difficulty_title')}</span>
            </div>
            <div className="summary-stat">
              <svg className="summary-stat-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span className="summary-stat-value">~25 {t('minutes')}</span>
              <span className="summary-stat-label">{t('est_time')}</span>
            </div>
            {selectedJob && (
              <div className="summary-stat">
                <svg className="summary-stat-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                <span className="summary-stat-value summary-role">{selectedJob.title}</span>
                <span className="summary-stat-label">{t('job_category')}</span>
              </div>
            )}
          </div>

          <div className="step-actions step-actions-center">
            <button className="btn btn-secondary" onClick={prevStep}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              {t('prev_step')}
            </button>
            <button
              className="btn btn-primary setup-start-btn"
              onClick={onStartInterview}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small" />
                  {t('btn_loading')}
                </>
              ) : (
                <>
                  {t('pre_session_start')}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
