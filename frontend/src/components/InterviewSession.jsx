import { useState, useEffect, useRef } from 'react';
import { transcribeAudio, generateTTS } from '../api';
import { useLang } from '../lang';
import { classifyQuestion, formatTime, getQuestionPhase } from '../utils';

// Difficulty-based time settings
const DIFFICULTY_CONFIG = {
  easy:   { recommended: 120, autoAdvance: 150, label: { mn: 'Хөнгөн', en: 'Easy' } },
  medium: { recommended: 90,  autoAdvance: 120, label: { mn: 'Дунд', en: 'Medium' } },
  hard:   { recommended: 60,  autoAdvance: 90,  label: { mn: 'Хүнд', en: 'Hard' } },
};

// Detect if candidate's answer looks like a question (for closing stage)
function looksLikeQuestion(text) {
  if (!text) return false;
  const t = text.trim();
  return t.includes('?') || t.includes(' уу') || t.includes(' вэ') ||
    t.includes(' юу ') || t.includes('мэдэхийг') || t.includes('хүсч байна') ||
    t.includes('тухай') || t.includes('would') || t.includes('could') || t.includes('what');
}

// Generate a contextual interviewer response to candidate's closing question
function generateInterviewerResponse(answer, lang) {
  const lower = answer.toLowerCase();
  const parts = [];

  if (lang === 'mn') {
    // Context-aware response based on keywords
    if (lower.includes('onboarding') || lower.includes('эхний') || lower.includes('сар') || lower.includes('хүлээлт') || lower.includes('зорилт')) {
      parts.push('Эхний 3 сард танд ментор хуваарилагдах бөгөөд багийн ажлын горим, хэрэглэж буй хэрэгсэл, дотоод процессуудтай танилцах болно. Бид шинэ ажилтнуудад аажмаар дасан зохицох боломж олгодог.');
    } else if (lower.includes('баг') || lower.includes('соёл') || lower.includes('хамт олон') || lower.includes('ажлын орчин')) {
      parts.push('Манай баг нээлттэй харилцааг эрхэмлэдэг. Долоо хоног тутмын багийн уулзалт байдаг бөгөөд хамт олон хоорондоо мэргэжлийн туршлагаа хуваалцдаг. Ажлын уян хатан орчин бий.');
    } else if (lower.includes('хөгжил') || lower.includes('өсөлт') || lower.includes('ахих') || lower.includes('карьер') || lower.includes('сургалт')) {
      parts.push('Бид ажилтнуудын мэргэжлийн хөгжилд ихээхэн анхаардаг. Жилд 2 удаа гүйцэтгэлийн үнэлгээ хийж, хувь хүний хөгжлийн төлөвлөгөө гаргадаг. Сургалтын боломж тогтмол байдаг.');
    } else if (lower.includes('технологи') || lower.includes('стек') || lower.includes('хэрэгсэл') || lower.includes('deploy') || lower.includes('код')) {
      parts.push('Бид орчин үеийн технологийн стек ашигладаг бөгөөд шинэ хэрэгслүүдийг идэвхтэй нэвтрүүлдэг. Код шалгалтын процесс, CI/CD pipeline зэрэг инженерийн шилдэг туршлагуудыг мөрддөг.');
    } else {
      parts.push('Сайн асуулт байна. Энэ талаар бид дараагийн шатны уулзалтад дэлгэрэнгүй ярилцах боломжтой.');
    }
    parts.push('Таны ярилцлагад оролцсонд баярлалаа. Бид удахгүй эргэж холбогдох болно. Амжилт хүсье!');
  } else {
    if (lower.includes('onboarding') || lower.includes('first') || lower.includes('month') || lower.includes('expect')) {
      parts.push('In the first three months, you would be paired with a mentor, get familiar with our workflows, tools, and internal processes. We believe in gradual ramp-up for new team members.');
    } else if (lower.includes('team') || lower.includes('culture') || lower.includes('environment') || lower.includes('work')) {
      parts.push('Our team values open communication. We have weekly team meetings and encourage knowledge sharing. The work environment is flexible and collaborative.');
    } else if (lower.includes('growth') || lower.includes('career') || lower.includes('promotion') || lower.includes('develop')) {
      parts.push('We invest in professional development. We conduct performance reviews twice a year and create individual development plans. Training opportunities are regularly available.');
    } else if (lower.includes('tech') || lower.includes('stack') || lower.includes('tools') || lower.includes('deploy') || lower.includes('code')) {
      parts.push('We use a modern tech stack and actively adopt new tools. We follow engineering best practices including code reviews and CI/CD pipelines.');
    } else {
      parts.push('That is a great question. We can discuss that in more detail during the next stage of the process.');
    }
    parts.push('Thank you for coming in today. We will be in touch soon. Best of luck!');
  }

  return parts.join(' ');
}

// Sanitize questions: replace vague technical assignment labels with real content
function sanitizeQuestion(q) {
  if (!q || !q.question) return q;
  const text = q.question;
  // Remove vague labels like [Техникийн даалгавар] if there's no actual content after it
  if (text.match(/^\[.*даалгавар\]\s*$/)) {
    return { ...q, question: q.sample_answer ? q.question : text.replace(/\[.*даалгавар\]\s*/, '').trim() };
  }
  // Clean the label but keep content
  if (text.includes('[Техникийн даалгавар]')) {
    const cleaned = text.replace(/\[Техникийн даалгавар\]\s*/g, '').trim();
    if (cleaned.length > 10) return { ...q, question: cleaned };
  }
  return q;
}

function InterviewSession({ questions: rawQuestions, onSessionEnd, difficulty = 'medium' }) {
  // Sanitize all questions on mount
  const questions = rawQuestions.map(sanitizeQuestion);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredPairs, setAnsweredPairs] = useState([]);
  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [recording, setRecording] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionTime, setQuestionTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [questionElapsed, setQuestionElapsed] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [typingText, setTypingText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const [waitingNext, setWaitingNext] = useState(false);
  const [phaseTransition, setPhaseTransition] = useState(null); // null or phase string
  const [closingPhase, setClosingPhase] = useState(null); // null | 'typing' | 'response' | 'ending'
  const [interviewerResponse, setInterviewerResponse] = useState('');
  const [responseTypingText, setResponseTypingText] = useState('');
  const [responseTypingDone, setResponseTypingDone] = useState(false);
  const { t, lang } = useLang();
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const transcriptEndRef = useRef(null);
  const textareaRef = useRef(null);

  const diffConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
  const RECOMMENDED_TIME = diffConfig.recommended;
  const AUTO_ADVANCE_TIME = diffConfig.autoAdvance;

  const currentQuestion = questions[currentIndex];
  const allQuestionsAnswered = currentIndex >= questions.length;
  const isComplete = allQuestionsAnswered && closingPhase !== 'response' && closingPhase !== 'typing';

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Per-question timer
  useEffect(() => {
    const timer = setInterval(() => setQuestionElapsed(Math.floor((Date.now() - questionTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [questionTime]);

  // Auto-advance: skip question after AUTO_ADVANCE_TIME
  useEffect(() => {
    if (isComplete || waitingNext || !typingDone) return;
    if (questionElapsed >= AUTO_ADVANCE_TIME) {
      handleAutoSkip();
    }
  }, [questionElapsed, isComplete, waitingNext, typingDone]);

  function handleAutoSkip() {
    const timeTaken = Math.floor((Date.now() - questionTime) / 1000);
    const pair = {
      question: currentQuestion.question,
      answer: '',
      timeTaken,
      tag: classifyQuestion(currentQuestion.question, currentQuestion.category),
      skipped: true,
    };
    const nextIndex = currentIndex + 1;
    setAnsweredPairs(prev => [...prev, pair]);
    setInputText('');

    if (nextIndex < questions.length) {
      setWaitingNext(true);
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setQuestionTime(Date.now());
        setQuestionElapsed(0);
        setWaitingNext(false);
      }, 400);
    } else {
      setCurrentIndex(nextIndex);
    }
  }

  // Typing animation
  useEffect(() => {
    if (!currentQuestion) return;
    setTypingDone(false);
    setTypingText('');
    const words = currentQuestion.question.split(' ');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypingText(words.slice(0, i).join(' '));
      if (i >= words.length) { clearInterval(interval); setTypingDone(true); }
    }, 60);
    return () => clearInterval(interval);
  }, [currentIndex]);

  // Auto-play audio
  useEffect(() => {
    if (!currentQuestion) return;
    const timer = setTimeout(async () => {
      if (audioRef.current) audioRef.current.pause();
      let audioSrc;
      if (currentQuestion.audio) {
        audioSrc = currentQuestion.audio;
      } else {
        try {
          const blob = await generateTTS(currentQuestion.question, lang);
          if (blob && blob.size > 0) audioSrc = URL.createObjectURL(blob);
        } catch { /* silent */ }
      }
      if (audioSrc) {
        const audio = new Audio(audioSrc);
        audioRef.current = audio;
        audio.play().catch(() => {});
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [answeredPairs]);

  // Focus textarea when ready
  useEffect(() => {
    if (typingDone && !waitingNext && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [typingDone, waitingNext]);

  // Cleanup audio and mic stream on unmount
  useEffect(() => () => {
    if (audioRef.current) audioRef.current.pause();
    if (streamRef.current) streamRef.current.getTracks().forEach(tr => tr.stop());
  }, []);

  function submitAnswer(answerText) {
    if (!answerText.trim()) return;
    const timeTaken = Math.floor((Date.now() - questionTime) / 1000);
    const pair = {
      question: currentQuestion.question,
      answer: answerText,
      timeTaken,
      tag: classifyQuestion(currentQuestion.question, currentQuestion.category),
      skipped: false,
    };
    const nextIndex = currentIndex + 1;
    setAnsweredPairs(prev => [...prev, pair]);
    setInputText('');

    if (nextIndex < questions.length) {
      // Check for phase transition
      const currentPhase = getQuestionPhase(currentQuestion.category);
      const nextPhase = getQuestionPhase(questions[nextIndex].category);
      const isPhaseChange = currentPhase !== nextPhase;

      setWaitingNext(true);
      if (isPhaseChange) {
        const transitionMessages = {
          middle: lang === 'mn' ? 'Маш сайн. Одоо үндсэн асуултууд руу шилжье.' : 'Great. Let\'s move on to the main questions.',
          ending: lang === 'mn' ? 'Сайн байна. Ярилцлагаа дуусгахад бэлэн үү?' : 'Good. Let\'s wrap up the interview.',
        };
        setPhaseTransition(transitionMessages[nextPhase] || null);
        setTimeout(() => {
          setPhaseTransition(null);
          setCurrentIndex(nextIndex);
          setQuestionTime(Date.now());
          setQuestionElapsed(0);
          setWaitingNext(false);
        }, 3500);
      } else {
        setTimeout(() => {
          setCurrentIndex(nextIndex);
          setQuestionTime(Date.now());
          setQuestionElapsed(0);
          setWaitingNext(false);
        }, 1200);
      }
    } else {
      // Last question answered — check for closing stage interviewer response
      const isClosingQ = currentQuestion.category === 'closing';
      if (isClosingQ && looksLikeQuestion(answerText)) {
        const response = generateInterviewerResponse(answerText, lang);
        setInterviewerResponse(response);
        setClosingPhase('typing'); // Show typing indicator first
        setCurrentIndex(nextIndex);
      } else {
        setCurrentIndex(nextIndex);
      }
    }
  }

  function handleTextSubmit() { submitAnswer(inputText); }

  const streamRef = useRef(null);

  function getRecorderMimeType() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', ''];
    for (const t of types) {
      if (!t || MediaRecorder.isTypeSupported(t)) return t || undefined;
    }
    return undefined;
  }

  function getFileExtension(mimeType) {
    if (!mimeType) return 'webm';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('mp4')) return 'mp4';
    return 'webm';
  }

  async function startRecording() {
    setAudioError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getRecorderMimeType();
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      mediaRecorder.onerror = () => {
        setRecording(false);
        stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
        setAudioError(lang === 'mn' ? 'Бичлэг алдаатай болсон. Дахин оролдоно уу.' : 'Recording failed. Please try again.');
        setTimeout(() => setAudioError(''), 5000);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
        const usedMime = mediaRecorder.mimeType || 'audio/webm';
        const ext = getFileExtension(usedMime);
        const blob = new Blob(chunksRef.current, { type: usedMime });

        if (blob.size < 100) {
          setAudioError(lang === 'mn' ? 'Дуу бичигдээгүй. Микрофоноо шалгаад дахин оролдоно уу.' : 'No audio captured. Check your mic and try again.');
          setTimeout(() => setAudioError(''), 5000);
          return;
        }

        setTranscribing(true);
        setAudioError('');
        try {
          const formData = new FormData();
          formData.append('audio', blob, `recording.${ext}`);
          formData.append('question', currentQuestion?.question || '');
          const result = await transcribeAudio(formData);
          const transcription = result.transcription || '';
          if (transcription.trim()) { submitAnswer(transcription); }
          else { setAudioError(t('audio_err_empty')); setTimeout(() => setAudioError(''), 5000); }
        } catch { setAudioError(t('audio_err_fail')); setTimeout(() => setAudioError(''), 5000); }
        finally { setTranscribing(false); }
      };

      mediaRecorder.start(1000); // collect in 1s chunks for reliability
      setRecording(true);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setAudioError(lang === 'mn' ? 'Микрофон зөвшөөрөгдөөгүй. Тохиргооноос зөвшөөрнө үү.' : 'Microphone access denied. Please allow access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setAudioError(lang === 'mn' ? 'Микрофон олдсонгүй. Микрофон холбогдсон эсэхийг шалгана уу.' : 'No microphone found. Please connect a microphone.');
      } else {
        setAudioError(lang === 'mn' ? 'Микрофон ашиглах боломжгүй байна.' : 'Unable to access microphone.');
      }
      setTimeout(() => setAudioError(''), 6000);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  // Typing indicator → response transition
  useEffect(() => {
    if (closingPhase !== 'typing') return;
    const timer = setTimeout(() => setClosingPhase('response'), 3500);
    return () => clearTimeout(timer);
  }, [closingPhase]);

  // Typing animation for interviewer response
  useEffect(() => {
    if (closingPhase !== 'response' || !interviewerResponse) return;
    setResponseTypingDone(false);
    setResponseTypingText('');
    const words = interviewerResponse.split(' ');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setResponseTypingText(words.slice(0, i).join(' '));
      if (i >= words.length) { clearInterval(interval); setResponseTypingDone(true); }
    }, 50);
    return () => clearInterval(interval);
  }, [closingPhase, interviewerResponse]);

  // Session complete — only fire when closing phase is done or wasn't triggered
  useEffect(() => {
    if (isComplete && answeredPairs.length > 0) {
      const totalDuration = Math.floor((Date.now() - startTime) / 1000);
      const answers = answeredPairs
        .filter(p => !p.skipped)
        .map(p => ({ question: p.question, text: p.answer }));
      onSessionEnd(answers, totalDuration);
    }
  }, [isComplete]);

  const timerPercent = Math.min((questionElapsed / RECOMMENDED_TIME) * 100, 100);
  const timerWarning = questionElapsed > RECOMMENDED_TIME;
  const showAutoAdvanceWarning = questionElapsed >= RECOMMENDED_TIME && questionElapsed < AUTO_ADVANCE_TIME;
  const autoAdvanceCountdown = AUTO_ADVANCE_TIME - questionElapsed;
  const questionTag = currentQuestion ? classifyQuestion(currentQuestion.question, currentQuestion.category) : 'general';
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  // Tips based on question category
  const tips = {
    introduction: lang === 'mn' ? ['Нэр, мэргэжил, туршлагаа дурдаарай', 'Ажлын чиглэлтэй холбоотой зүйлсээ хэлээрэй', '30-60 секундэд багтаарай'] : ['Mention name, field, experience', 'Focus on career-relevant details', 'Keep it under 60 seconds'],
    motivation: lang === 'mn' ? ['Бодит шалтгаанаа хэлээрэй', 'Компани/албан тушаалтай холбоорой', 'Урт хугацааны зорилгоо дурдаарай'] : ['Give genuine reasons', 'Connect to the role/company', 'Mention long-term goals'],
    behavioral: lang === 'mn' ? ['STAR аргыг ашигла (Нөхцөл, Даалгавар, Үйлдэл, Үр дүн)', 'Бодит жишээ хэлээрэй', 'Суралцсан зүйлээ дурдаарай'] : ['Use STAR method (Situation, Task, Action, Result)', 'Give a real example', 'Mention what you learned'],
    technical: lang === 'mn' ? ['Тодорхой жишээ, дата хэлээрэй', 'Мэддэг/мэдэхгүй зүйлээ шударгаар хэлээрэй', 'Суралцах чадвараа харуулаарай'] : ['Give specific examples with data', 'Be honest about what you know', 'Show willingness to learn'],
    situational: lang === 'mn' ? ['Алхам алхмаар тайлбарлаарай', 'Шийдвэр гаргах үйл явцаа харуулаарай', 'Бодит нөхцөл байдлаас жишээ ав'] : ['Explain step by step', 'Show your decision-making process', 'Reference real situations'],
    general: lang === 'mn' ? ['Тодорхой, товч хариулаарай', 'Жишээгээр баталгаажуулаарай', 'Өөрийнхөө давуу талыг харуулаарай'] : ['Be clear and concise', 'Support with examples', 'Highlight your strengths'],
  };

  const currentTips = tips[questionTag] || tips.general;

  return (
    <div className="interview-workspace">
      {/* LEFT PANEL */}
      <div className="ws-left">
        <div className="ws-left-timer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span>{formatTime(elapsed)}</span>
        </div>
        <div className={`ws-difficulty-badge difficulty-${difficulty}`}>
          {diffConfig.label[lang] || diffConfig.label.en}
        </div>

        <div className="ws-question-list">
          {(() => {
            const phaseLabels = {
              opening: lang === 'mn' ? 'Нээлт' : 'Opening',
              middle: lang === 'mn' ? 'Үндсэн' : 'Main',
              ending: lang === 'mn' ? 'Хаалт' : 'Closing',
            };
            let lastPhase = null;
            return questions.map((q, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              const tag = classifyQuestion(q.question, q.category);
              const wasSkipped = done && answeredPairs[i]?.skipped;
              const phase = getQuestionPhase(q.category);
              const showPhaseLabel = phase !== lastPhase;
              lastPhase = phase;
              return (
                <div key={i}>
                  {showPhaseLabel && (
                    <div className={`ws-phase-label phase-${phase}`}>{phaseLabels[phase]}</div>
                  )}
                  <div className={`ws-q-item ${active ? 'active' : ''} ${done ? 'done' : ''} ${wasSkipped ? 'skipped' : ''}`}>
                    <span className="ws-q-num">
                      {done ? (
                        wasSkipped ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                        )
                      ) : i + 1}
                    </span>
                    <span className="ws-q-text">{lang === 'mn' ? `Асуулт ${i + 1}` : `Question ${i + 1}`}</span>
                    <span className={`ws-q-tag tag-${tag}`}>{t(`question_tag_${tag}`)}</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        <div className="ws-left-footer">
          <div className="ws-progress-bar">
            <div className="ws-progress-fill" style={{ width: `${(currentIndex / questions.length) * 100}%` }} />
          </div>
          <span className="ws-progress-text">{currentIndex}/{questions.length}</span>
        </div>
      </div>

      {/* CENTER PANEL */}
      <div className="ws-center">
        {!allQuestionsAnswered && currentQuestion && closingPhase !== 'response' && (
          <>
            <div className="ws-center-top">
              <span className="ws-center-progress">
                {t('progress')} {currentIndex + 1} {t('question_of')} {questions.length}
              </span>
              <span className={`question-tag tag-${questionTag}`}>{t(`question_tag_${questionTag}`)}</span>
            </div>

            <div className="ws-question-panel">
              <div className="ws-question-number">{currentIndex + 1}</div>
              <p className="ws-question-text">
                {typingText}
                {!typingDone && <span className="typing-cursor">|</span>}
              </p>
              {currentQuestion.audio && typingDone && (
                <button className="ws-replay-btn" onClick={() => { const a = new Audio(currentQuestion.audio); a.play().catch(() => {}); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  {t('replay')}
                </button>
              )}
            </div>

            {/* Timer bar with auto-advance warning */}
            <div className="ws-timer-bar">
              <div className={`ws-timer-fill ${timerWarning ? 'warning' : ''}`} style={{ width: `${timerPercent}%` }} />
              <span className="ws-timer-text">{formatTime(questionElapsed)}</span>
            </div>

            {showAutoAdvanceWarning && (
              <div className="auto-advance-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{t('auto_advance_warning')} — {autoAdvanceCountdown} {t('time_warning')}</span>
              </div>
            )}

            {typingDone && !waitingNext && (
              <div className="ws-answer-section">
                <div className="ws-answer-tabs">
                  <button className={inputMode === 'text' ? 'active' : ''} onClick={() => setInputMode('text')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    {t('tab_text')}
                  </button>
                  <button className={inputMode === 'audio' ? 'active' : ''} onClick={() => setInputMode('audio')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
                    {t('tab_audio')}
                  </button>
                </div>

                {inputMode === 'text' ? (
                  <div className="ws-text-input">
                    <textarea
                      ref={textareaRef}
                      placeholder={t('placeholder_answer')}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); } }}
                      rows={5}
                    />
                    <div className="ws-text-footer">
                      <span className="ws-word-count">{wordCount} {lang === 'mn' ? 'үг' : 'words'}</span>
                      <button className="btn btn-primary ws-send-btn" onClick={handleTextSubmit} disabled={!inputText.trim()}>
                        {t('btn_send')}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ws-audio-input">
                    {transcribing ? (
                      <div className="ws-transcribing"><span className="spinner-small" /> {t('transcribing')}</div>
                    ) : (
                      <div className="ws-audio-controls">
                        <button className={`ws-record-btn ${recording ? 'active' : ''}`} onClick={recording ? stopRecording : startRecording}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={recording ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/>{recording && <rect x="9" y="9" width="6" height="6" rx="1"/>}</svg>
                          {recording ? t('btn_stop') : t('btn_record')}
                        </button>
                        {recording && <span className="ws-recording-pulse">{t('recording')}</span>}
                      </div>
                    )}
                    {audioError && <p className="ws-audio-error">{audioError}</p>}
                  </div>
                )}
              </div>
            )}

            {waitingNext && (
              <div className="ws-waiting">
                {phaseTransition ? (
                  <div className="ws-phase-transition">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <p>{phaseTransition}</p>
                  </div>
                ) : (
                  <span className="spinner-small" />
                )}
              </div>
            )}
          </>
        )}

        {/* Typing indicator before interviewer response */}
        {closingPhase === 'typing' && (
          <div className="ws-interviewer-response">
            <div className="ws-center-top">
              <span className="ws-center-progress">{t('interviewer')}</span>
            </div>
            <div className="ws-typing-indicator">
              <div className="ws-typing-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div className="ws-typing-dots">
                <span /><span /><span />
              </div>
              <p className="ws-typing-label">{t('interviewer_responding')}</p>
            </div>
          </div>
        )}

        {/* Interviewer response to candidate's closing question */}
        {closingPhase === 'response' && (
          <div className="ws-interviewer-response">
            <div className="ws-center-top">
              <span className="ws-center-progress">{t('interviewer')}</span>
            </div>
            <div className="ws-question-panel ws-response-panel">
              <div className="ws-question-number">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <p className="ws-question-text">
                {responseTypingText}
                {!responseTypingDone && <span className="typing-cursor">|</span>}
              </p>
            </div>
            {responseTypingDone && (
              <button
                className="btn btn-primary ws-end-btn"
                onClick={() => {
                  setClosingPhase('ending');
                }}
              >
                {t('close_interview')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </button>
            )}
          </div>
        )}

        {isComplete && (
          <div className="ws-complete">
            <div className="spinner" />
            <p>{t('session_complete')}</p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="ws-right">
        <div className="ws-right-section">
          <h3 className="ws-right-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
            {t('results_transcript')}
          </h3>
          <div className="ws-transcript">
            {answeredPairs.map((pair, i) => (
              <div key={i} className={`ws-transcript-item ${pair.skipped ? 'ws-transcript-skipped' : ''}`}>
                <div className="ws-transcript-header">
                  <span className="ws-transcript-num">{t('q_prefix')}{i + 1}</span>
                  <span className={`ws-q-tag tag-${pair.tag}`}>{t(`question_tag_${pair.tag}`)}</span>
                  <span className="ws-transcript-time">{formatTime(pair.timeTaken)}</span>
                </div>
                {pair.skipped ? (
                  <p className="ws-transcript-answer ws-skipped-label">{t('question_skipped')}</p>
                ) : (
                  <p className="ws-transcript-answer">{pair.answer.slice(0, 120)}{pair.answer.length > 120 ? '...' : ''}</p>
                )}
              </div>
            ))}
            {answeredPairs.length === 0 && (
              <p className="ws-transcript-empty">{lang === 'mn' ? 'Хариултууд энд харагдана' : 'Your answers will appear here'}</p>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Tips Panel */}
        {!allQuestionsAnswered && closingPhase !== 'response' && (
          <div className="ws-right-section ws-tips-section">
            <h3 className="ws-right-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              {lang === 'mn' ? 'Зөвлөмж' : 'Tips'}
            </h3>
            <ul className="ws-tips-list">
              {currentTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewSession;
