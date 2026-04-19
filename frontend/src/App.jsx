import { useState } from 'react';
import './App.css';
import { analyzeBatch } from './api';
import { useLang } from './lang';
import { getSmartQuestions } from './questionBank';
import { getCurrentUser, setCurrentUser, logoutUser, userKey } from './auth';
import Layout from './components/Layout';
import WelcomePage from './components/WelcomePage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import InterviewSession from './components/InterviewSession';
import SessionResults from './components/SessionResults';
import HistoryView from './components/HistoryView';
import InterviewGuides from './components/InterviewGuides';

// All difficulty levels use 15 questions — difficulty affects complexity, not length

function App() {
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());
  const [phase, setPhase] = useState(() => getCurrentUser() ? 'welcome' : 'auth');
  const [selectedJob, setSelectedJob] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeSkills, setResumeSkills] = useState([]);
  const [userName, setUserName] = useState(() => {
    const user = getCurrentUser();
    const key = userKey(user?.id, 'name');
    return localStorage.getItem(key) || user?.displayName || '';
  });
  const { t } = useLang();

  function handleLogin(user) {
    setCurrentUser(user);
    setCurrentUserState(user);
    const key = userKey(user.id, 'name');
    setUserName(localStorage.getItem(key) || user.displayName || '');
    setPhase('welcome');
  }

  function handleGuestMode() {
    setCurrentUserState(null);
    setCurrentUser(null);
    setUserName('');
    setPhase('welcome');
  }

  function handleLogout() {
    logoutUser();
    setCurrentUserState(null);
    setUserName('');
    handleRestart();
    setPhase('auth');
  }

  function handleNavigate(key) {
    if (key === 'setup' || key === 'interview') {
      if (phase === 'interview' && !window.confirm(t('btn_back_confirm'))) return;
      handleRestart();
    } else if (key === 'history') {
      setPhase('history');
    } else if (key === 'guides') {
      setPhase('guides');
    }
  }

  function handleUserName(name) {
    setUserName(name);
    const key = userKey(currentUser?.id, 'name');
    localStorage.setItem(key, name);
  }

  async function handleStartInterview() {
    setLoading(true);
    setError('');
    try {
      const roleKey = selectedJob?.title || '';
      // Use local question bank with difficulty-based selection and repetition control
      const questions = getSmartQuestions(roleKey || 'general', difficulty, currentUser?.id);

      if (questions.length === 0) {
        throw new Error('No questions available');
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

      // Store full session data for history detail view
      const sessionData = {
        date: new Date().toISOString(),
        score: Math.round(data.aggregate.overall_score),
        category: selectedJob?.title || '',
        questionsAnswered: answers.length,
        totalQuestions: sessionQuestions.length,
        duration: totalDuration,
        difficulty,
        // Full data for detail view
        questions: sessionQuestions.map(q => ({
          question: q.question,
          category: q.category,
          sample_answer: q.sample_answer,
        })),
        answers: answers.map(a => ({ question: a.question, text: a.text })),
        results: {
          aggregate: {
            overall_score: data.aggregate.overall_score,
            dimension_scores: data.aggregate.dimension_scores,
            strengths: data.aggregate.strengths,
            improvements: data.aggregate.improvements,
            suggestions: data.aggregate.suggestions,
          },
          per_question: (data.per_question || []).map(pq => pq ? {
            feedback: {
              overall_score: pq.feedback?.overall_score,
              improvements: pq.feedback?.improvements || [],
              strengths: pq.feedback?.strengths || [],
            }
          } : null),
        },
      };

      // Save history with user-namespaced key
      const histKey = userKey(currentUser?.id, 'history');
      const hist = JSON.parse(localStorage.getItem(histKey) || '[]');
      hist.unshift(sessionData);
      localStorage.setItem(histKey, JSON.stringify(hist.slice(0, 20)));
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

  // Compute guided step index for the step indicator
  const stepIndex =
    phase === 'setup' ? 0 :
    phase === 'interview' ? 1 :
    phase === 'results' ? 2 : -1;

  return (
    <>
      {/* AUTH PAGE */}
      {phase === 'auth' && (
        <AuthPage onLogin={handleLogin} onGuest={handleGuestMode} />
      )}

      {/* WELCOME / SPLASH PAGE */}
      {phase === 'welcome' && (
        <WelcomePage onStart={() => setPhase('setup')} />
      )}

      {/* MAIN APP WITH SIDEBAR */}
      {phase !== 'welcome' && phase !== 'auth' && (
        <Layout phase={phase} onNavigate={handleNavigate} stepIndex={stepIndex} onLogout={handleLogout} currentUser={currentUser}>
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
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
              userName={userName}
              onUserNameChange={handleUserName}
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
                difficulty={difficulty}
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
                totalQuestions={sessionQuestions.length}
                onRestart={handleRestart}
              />
            </>
          )}

          {/* HISTORY PHASE */}
          {phase === 'history' && (
            <HistoryView onStartNew={handleRestart} userId={currentUser?.id} />
          )}

          {/* GUIDES PHASE */}
          {phase === 'guides' && (
            <InterviewGuides />
          )}
        </Layout>
      )}
    </>
  );
}

export default App;
