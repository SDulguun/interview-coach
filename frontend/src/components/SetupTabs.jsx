import { useState } from 'react';
import { useLang } from '../lang';
import JobSelector from './JobSelector';
import ResumeUpload from './ResumeUpload';

// Simple frontend skill extraction from job description text
function extractSkillsFromJD(text) {
  if (!text || text.length < 20) return { skills: [], requirements: [] };

  const skillPatterns = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
    'React', 'Angular', 'Vue', 'Node\\.js', 'Express', 'Django', 'Flask', 'Spring',
    'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
    'Excel', 'PowerPoint', 'Word', 'SAP', 'AutoCAD',
    'Photoshop', 'Illustrator', 'Figma', 'Sketch',
    // Mongolian skill words
    'харилцааны чадвар', 'багаар ажиллах', 'манлайлал', 'цагийн менежмент',
    'аналитик', 'шийдвэр гаргах', 'борлуулалт', 'маркетинг', 'санхүү',
    'нягтлан бодох', 'хүний нөөц', 'менежмент', 'програмчлал', 'дата шинжилгээ',
  ];

  const lower = text.toLowerCase();
  const skills = skillPatterns.filter(p => {
    const regex = new RegExp(p, 'i');
    return regex.test(text);
  });

  // Extract requirement-like lines
  const lines = text.split(/[\n•\-]/);
  const requirements = lines
    .map(l => l.trim())
    .filter(l => l.length > 15 && l.length < 200)
    .filter(l => /шаардлага|чадвар|туршлага|мэдлэг|require|experience|skill|knowledge|ability/i.test(l))
    .slice(0, 5);

  return { skills: [...new Set(skills)], requirements };
}

function SetupTabs({ selectedJob, onJobChange, onJobDescription, onResumeSkills }) {
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState('quick');
  const [jdText, setJdText] = useState('');
  const [jdAnalysis, setJdAnalysis] = useState(null);

  function handleJdChange(e) {
    const text = e.target.value;
    setJdText(text);
    onJobDescription(text);
    setJdAnalysis(null); // Reset analysis when text changes
  }

  function handleAnalyzeJD() {
    const result = extractSkillsFromJD(jdText);
    setJdAnalysis(result);
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
            <p className="jd-purpose">{t('jd_purpose')}</p>
            <textarea
              className="jd-textarea"
              placeholder={t('jd_placeholder')}
              value={jdText}
              onChange={handleJdChange}
              rows={5}
            />
            {jdText.trim().length > 20 && !jdAnalysis && (
              <button className="btn btn-primary btn-sm jd-analyze-btn" onClick={handleAnalyzeJD}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                {t('jd_analyze')}
              </button>
            )}
            {jdAnalysis && (
              <div className="jd-analysis-result">
                {jdAnalysis.skills.length > 0 && (
                  <div className="jd-analysis-section">
                    <label className="jd-analysis-label">{t('jd_skills_found')}</label>
                    <div className="jd-skills-chips">
                      {jdAnalysis.skills.map((skill, i) => (
                        <span key={i} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {jdAnalysis.requirements.length > 0 && (
                  <div className="jd-analysis-section">
                    <label className="jd-analysis-label">{t('jd_requirements')}</label>
                    <ul className="jd-requirements-list">
                      {jdAnalysis.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {jdAnalysis.skills.length === 0 && jdAnalysis.requirements.length === 0 && (
                  <p className="jd-analysis-empty">
                    {lang === 'mn'
                      ? 'Тодорхой ур чадвар олдсонгүй. Ажлын зарыг илүү дэлгэрэнгүй оруулна уу.'
                      : 'No specific skills detected. Try pasting a more detailed job description.'}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="divider" />

          <ResumeUpload onSkillsExtracted={handleResumeSkills} />
        </div>
      )}
    </div>
  );
}

export default SetupTabs;
