import { useState } from 'react';
import { useLang } from '../lang';
import { parseResume } from '../api';

function ResumeUpload({ onSkillsExtracted }) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await parseResume(formData);
      setSkills(result.skills || []);
      onSkillsExtracted(result.skills || [], result.text || '');
    } catch (err) {
      setError(err.message || 'Failed to parse resume');
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="resume-upload">
      <label className="resume-label">{t('resume_label')}</label>
      <p className="resume-hint">{t('resume_hint')}</p>

      <div className="file-input-wrapper">
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFile}
          className="file-input"
          id="resume-file"
        />
        <label htmlFor="resume-file" className="file-input-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {fileName || t('resume_label')}
        </label>
      </div>

      {loading && (
        <div className="resume-loading">
          <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
        </div>
      )}

      {error && <p className="resume-error">{error}</p>}

      {skills.length > 0 && (
        <div className="resume-result">
          <p className="resume-success">{t('resume_uploaded')}</p>
          <p className="resume-skills-label">{t('resume_skills')}</p>
          <div className="resume-skills-tags">
            {skills.map((skill, i) => (
              <span key={i} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
