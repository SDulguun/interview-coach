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
import { CommandPalette, PageTransition } from './components/ui';

// Easy: 10 questions. Medium: 15 questions. Hard: 20 questions.

function App() {
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());
  const [phase, setPhase] = useState(() => getCurrentUser() ? 'welcome' : 'auth');
  const [selectedJob, setSelectedJob] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewingSession, setViewingSession] = useState(null);
  const [repracticeCtx, setRepracticeCtx] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [resumeSkills, setResumeSkills] = useState([]);
  const [userName, setUserName] = useState(() => {
    const user = getCurrentUser();
    const key = userKey(user?.id, 'name');
    return localStorage.getItem(key) || user?.displayName || '';
  });
  const { t, lang, toggleLang } = useLang();
  const [cmdOpen, setCmdOpen] = useState(false);

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
    if (key === 'welcome') {
      if (phase === 'interview' && !window.confirm(t('btn_back_confirm'))) return;
      setError('');
      setPhase('welcome');
    } else if (key === 'setup' || key === 'interview') {
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
      setSessionId(`s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
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

    if (!answers || answers.length === 0) {
      setError(t('err_no_answers'));
      setLoading(false);
      setPhase('setup');
      return;
    }

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

      const newScore = Math.round(data.aggregate.overall_score);
      // Store full session data for history detail view
      const sessionData = {
        date: new Date().toISOString(),
        score: newScore,
        category: selectedJob?.title || (repracticeCtx ? (lang === 'mn' ? 'Дахин дасгал' : 'Re-practice') : ''),
        questionsAnswered: answers.length,
        totalQuestions: sessionQuestions.length,
        duration: totalDuration,
        difficulty,
        repractice: !!repracticeCtx,
        originalScore: repracticeCtx?.originalScore ?? null,
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

      if (repracticeCtx) {
        setResults({
          ...data,
          session: {
            ...(data.session || {}),
            repractice: true,
            originalScore: repracticeCtx.originalScore,
            newScore,
          },
        });
        setRepracticeCtx(null);
      }
      setPhase('results');
    } catch (err) {
      console.error('Analysis failed:', err, err?.response?.data);
      const detail = err?.response?.data?.detail;
      if (detail === 'No answers provided') {
        setError(t('err_no_answers'));
      } else if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')) {
        setError(lang === 'mn'
          ? 'Хариу удаж байна. Интернэтээ шалгаад дахин оролдоорой.'
          : 'Analysis took too long. Check your connection and try again.');
      } else if (!err?.response) {
        setError(lang === 'mn'
          ? 'Сервертэй холбогдож чадсангүй. Backend асаалттай байгаа эсэхээ шалгаарай.'
          : 'Could not reach the server. Please make sure the backend is running.');
      } else {
        setError(t('err_analyze'));
      }
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
    setViewingSession(null);
    setRepracticeCtx(null);
  }

  function handleOpenSession(sessionData) {
    setViewingSession(sessionData);
    setPhase('results');
  }

  function handlePracticeQuestion(question, originalScore) {
    if (!question) return;
    setViewingSession(null);
    setSessionAnswers([]);
    setResults(null);
    setSessionQuestions([question]);
    setSessionId(`s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    setRepracticeCtx({ originalScore, question: question.question });
    setPhase('interview');
  }

  function handleResumeSkills(skills) {
    setResumeSkills(skills);
  }

  function handleCommand(id) {
    if (id === 'new')          { handleRestart(); }
    else if (id === 'resume')  { setPhase('interview'); }
    else if (id === 'history') { setPhase('history'); }
    else if (id === 'star' || id === 'guides') { setPhase('guides'); }
    else if (id === 'lang')    { toggleLang(); }
    else if (id === 'logout')  { handleLogout(); }
  }

  // Compute guided step index for the step indicator
  const stepIndex =
    phase === 'setup' ? 0 :
    phase === 'interview' ? 1 :
    phase === 'results' ? 2 : -1;

  const cmdPaused = phase === 'interview';

  return (
    <>
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onCommand={handleCommand}
        paused={cmdPaused}
        lang={lang}
      />

      {/* AUTH PAGE */}
      {phase === 'auth' && (
        <AuthPage onLogin={handleLogin} onGuest={handleGuestMode} />
      )}

      {/* WELCOME / SPLASH PAGE */}
      {phase === 'welcome' && (
        <WelcomePage onStart={() => setPhase('setup')} onOpenPalette={() => setCmdOpen(true)} />
      )}

      {/* MAIN APP WITH SIDEBAR */}
      {phase !== 'welcome' && phase !== 'auth' && (
        <Layout phase={phase} onNavigate={handleNavigate} stepIndex={stepIndex} onLogout={handleLogout} currentUser={currentUser} onOpenCmd={() => setCmdOpen(true)}>
          {error && <div className="error-banner">{error}</div>}

          <PageTransition keyName={phase}>
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
                jobTitle={selectedJob?.title || ''}
                userName={userName}
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
          {phase === 'results' && (() => {
            const v = viewingSession;
            const showResults = v
              ? {
                  ...v.results,
                  session: {
                    total_duration_seconds: v.duration,
                    total_questions: v.totalQuestions,
                    repractice: !!v.repractice,
                    originalScore: v.originalScore ?? null,
                    newScore: v.score,
                  },
                }
              : results;
            const showAnswers   = v ? v.answers   : sessionAnswers;
            const showQuestions = v ? v.questions : sessionQuestions;
            const showSessionId = v ? `hist-${v.date}` : sessionId;
            const showJobTitle  = v ? v.category   : (selectedJob?.title || '');
            const showDifficulty = v ? v.difficulty : difficulty;
            return (
              <>
                <button className="btn btn-back" onClick={() => {
                  if (v) { setViewingSession(null); setPhase('history'); }
                  else handleRestart();
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                  {t('btn_back')}
                </button>
                <SessionResults
                  results={showResults}
                  answers={showAnswers}
                  questions={showQuestions}
                  totalQuestions={showQuestions?.length || 0}
                  sessionId={showSessionId}
                  jobTitle={showJobTitle}
                  difficulty={showDifficulty}
                  userName={userName}
                  onRestart={handleRestart}
                  onPracticeQuestion={handlePracticeQuestion}
                />
              </>
            );
          })()}

          {/* HISTORY PHASE */}
          {phase === 'history' && (
            <HistoryView
              onStartNew={handleRestart}
              userId={currentUser?.id}
              onOpenSession={handleOpenSession}
            />
          )}

          {/* GUIDES PHASE */}
          {phase === 'guides' && (
            <InterviewGuides />
          )}
          </PageTransition>
        </Layout>
      )}
    </>
  );
}

export default App;
