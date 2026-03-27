import { useState } from 'react';
import './App.css';
import { getSampleQuestions, generateHybridQuestions, analyzeBatch } from './api';
import { useLang } from './lang';
import Layout from './components/Layout';
import WelcomePage from './components/WelcomePage';
import Dashboard from './components/Dashboard';
import InterviewSession from './components/InterviewSession';
import SessionResults from './components/SessionResults';
import HistoryView from './components/HistoryView';

const NUM_QUESTIONS = 5;

function App() {
  const [phase, setPhase] = useState('welcome'); // welcome | setup | interview | results | history
  const [selectedJob, setSelectedJob] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeSkills, setResumeSkills] = useState([]);
  const { t } = useLang();

  function handleNavigate(key) {
    if (key === 'setup') {
      if (phase === 'interview' && !window.confirm(t('btn_back_confirm'))) return;
      handleRestart();
    } else if (key === 'interview') {
      if (sessionQuestions.length > 0) setPhase('interview');
    } else if (key === 'history') {
      setPhase('history');
    }
  }

  async function handleStartInterview() {
    setLoading(true);
    setError('');
    try {
      const hasContext = selectedJob || jobDescription || resumeSkills.length > 0;

      let questions;
      if (hasContext) {
        const data = await generateHybridQuestions({
          category: selectedJob?.title || '',
          jobDescription,
          skills: resumeSkills.join(', '),
          numQuestions: NUM_QUESTIONS,
        });
        questions = data.questions || [];
      } else {
        const data = await getSampleQuestions();
        const allQuestions = data.questions || [];
        const opening = allQuestions.find(q => q.question.includes('танилцуулна'));
        const closing = allQuestions.find(q => q.question.includes('асуух зүйл'));
        const middle = allQuestions
          .filter(q => q !== opening && q !== closing)
          .sort(() => Math.random() - 0.5)
          .slice(0, NUM_QUESTIONS - 2);
        questions = [opening, ...middle, closing].filter(Boolean);
      }

      setSessionQuestions(questions);
      setPhase('interview');
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError(t('err_load'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSessionEnd(answers, totalDuration) {
    setSessionAnswers(answers);
    setLoading(true);
    setError('');
    try {
      const allSkills = [
        selectedJob?.required_skills || '',
        resumeSkills.join(', '),
      ].filter(Boolean).join(', ');

      const data = await analyzeBatch(
        answers,
        allSkills,
        totalDuration
      );
      setResults(data);
      const hist = JSON.parse(localStorage.getItem('interview-history') || '[]');
      hist.unshift({
        date: new Date().toISOString(),
        score: Math.round(data.aggregate.overall_score),
        category: selectedJob?.title || '',
        questionsAnswered: answers.length,
        duration: totalDuration,
      });
      localStorage.setItem('interview-history', JSON.stringify(hist.slice(0, 20)));
      setPhase('results');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(t('err_analyze'));
    } finally {
      setLoading(false);
    }
  }

  function handleRestart() {
    setPhase('setup');
    setSelectedJob(null);
    setSessionQuestions([]);
    setSessionAnswers([]);
    setResults(null);
    setError('');
    setJobDescription('');
    setResumeSkills([]);
  }

  function handleResumeSkills(skills) {
    setResumeSkills(skills);
  }

  return (
    <>
      {/* WELCOME / SPLASH PAGE */}
      {phase === 'welcome' && (
        <WelcomePage onStart={() => setPhase('setup')} />
      )}

      {/* MAIN APP WITH SIDEBAR */}
      {phase !== 'welcome' && (
        <Layout phase={phase} onNavigate={handleNavigate}>
          {error && <div className="error-banner">{error}</div>}

          {/* DASHBOARD / SETUP PHASE */}
          {phase === 'setup' && (
            <Dashboard
              selectedJob={selectedJob}
              onJobChange={setSelectedJob}
              onJobDescription={setJobDescription}
              onResumeSkills={handleResumeSkills}
              onStartInterview={handleStartInterview}
              loading={loading}
            />
          )}

          {/* INTERVIEW PHASE */}
          {phase === 'interview' && !loading && (
            <>
              <button className="btn btn-back" onClick={() => {
                if (window.confirm(t('btn_back_confirm'))) handleRestart();
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                {t('btn_back')}
              </button>
              <InterviewSession
                questions={sessionQuestions}
                onSessionEnd={handleSessionEnd}
              />
            </>
          )}

          {/* LOADING (analyzing) */}
          {loading && phase === 'interview' && (
            <div className="loading-spinner">
              <div className="spinner" />
              <p>{t('analyzing')}</p>
            </div>
          )}

          {/* RESULTS PHASE */}
          {phase === 'results' && (
            <>
              <button className="btn btn-back" onClick={handleRestart}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                {t('btn_back')}
              </button>
              <SessionResults
                results={results}
                answers={sessionAnswers}
                questions={sessionQuestions}
                onRestart={handleRestart}
              />
            </>
          )}

          {/* HISTORY PHASE */}
          {phase === 'history' && (
            <HistoryView onStartNew={handleRestart} />
          )}
        </Layout>
      )}
    </>
  );
}

export default App;
