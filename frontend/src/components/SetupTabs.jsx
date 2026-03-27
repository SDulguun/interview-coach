import { useState } from 'react';
import { useLang } from '../lang';
import JobSelector from './JobSelector';
import ResumeUpload from './ResumeUpload';

function SetupTabs({ selectedJob, onJobChange, onJobDescription, onResumeSkills }) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('quick');
  const [jdText, setJdText] = useState('');

  function handleJdChange(e) {
    const text = e.target.value;
    setJdText(text);
    onJobDescription(text);
  }

  function handleResumeSkills(skills, resumeText) {
    onResumeSkills(skills, resumeText);
  }

  return (
    <div className="card setup-tabs-card">
      <div className="setup-tabs">
        <button
          className={activeTab === 'quick' ? 'active' : ''}
          onClick={() => setActiveTab('quick')}
        >
          {t('tab_quick_start')}
        </button>
        <button
          className={activeTab === 'custom' ? 'active' : ''}
          onClick={() => setActiveTab('custom')}
        >
          {t('tab_customize')}
        </button>
      </div>

      {activeTab === 'quick' && (
        <div className="tab-content">
          <JobSelector onJobSelect={onJobChange} />
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="tab-content">
          <div className="jd-section">
            <label className="jd-label">{t('jd_label')}</label>
            <textarea
              className="jd-textarea"
              placeholder={t('jd_placeholder')}
              value={jdText}
              onChange={handleJdChange}
              rows={5}
            />
          </div>

          <div className="divider" />

          <ResumeUpload onSkillsExtracted={handleResumeSkills} />
        </div>
      )}
    </div>
  );
}

export default SetupTabs;
