import { useState, useEffect, useRef } from 'react';
import { transcribeAudio, generateTTS } from '../api';
import { useLang } from '../lang';

function InterviewSession({ questions, onSessionEnd }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [recording, setRecording] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionTime, setQuestionTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [typingText, setTypingText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const [waitingNext, setWaitingNext] = useState(false);
  const { t } = useLang();
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const currentQuestion = questions[currentIndex];
  const isComplete = currentIndex >= questions.length;

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Show first question on mount
  useEffect(() => {
    if (questions.length > 0) {
      setMessages([{ type: 'question', text: questions[0].question, audio: questions[0].audio }]);
      setQuestionTime(Date.now());
      setTypingDone(false);
      setTypingText('');
    }
  }, []);

  // Typing animation for the latest question
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.type !== 'question') return;

    setTypingDone(false);
    setTypingText('');
    const words = lastMsg.text.split(' ');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypingText(words.slice(0, i).join(' '));
      if (i >= words.length) {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Auto-play audio when a new question appears (pre-generated or dynamic TTS)
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.type !== 'question') return;

    const timer = setTimeout(async () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      let audioSrc;
      if (lastMsg.audio) {
        // Use pre-generated audio file
        audioSrc = lastMsg.audio;
      } else {
        // Generate TTS on-the-fly for AI/CSV questions
        try {
          const blob = await generateTTS(lastMsg.text);
          if (blob && blob.size > 0) {
            audioSrc = URL.createObjectURL(blob);
          }
        } catch {
          // Silent fail — question text is still shown
        }
      }

      if (audioSrc) {
        const audio = new Audio(audioSrc);
        audioRef.current = audio;
        audio.play().catch(() => {});
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function submitAnswer(answerText) {
    if (!answerText.trim()) return;

    const timeTaken = Math.floor((Date.now() - questionTime) / 1000);
    const nextIndex = currentIndex + 1;

    // Step 1: add answer only
    setMessages(prev => [...prev, { type: 'answer', text: answerText, timeTaken }]);
    setInputText('');

    if (nextIndex < questions.length) {
      // Step 2: after a pause, add the next question
      setWaitingNext(true);
      setTimeout(() => {
        const nextQ = questions[nextIndex];
        setMessages(prev => [...prev, { type: 'question', text: nextQ.question, audio: nextQ.audio }]);
        setCurrentIndex(nextIndex);
        setQuestionTime(Date.now());
        setWaitingNext(false);
      }, 800);
    } else {
      // Session complete
      setCurrentIndex(nextIndex);
    }
  }

  function handleTextSubmit() {
    submitAnswer(inputText);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());

        // Transcribe via backend
        setTranscribing(true);
        setAudioError('');
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          formData.append('question', currentQuestion?.question || '');
          const result = await transcribeAudio(formData);
          const transcription = result.transcription || '';
          if (transcription.trim()) {
            submitAnswer(transcription);
          } else {
            setAudioError(t('audio_err_empty'));
            setTimeout(() => setAudioError(''), 5000);
          }
        } catch (err) {
          console.error('Transcription failed:', err);
          setAudioError(t('audio_err_fail'));
          setTimeout(() => setAudioError(''), 5000);
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  // When session is complete, collect answers and call onSessionEnd
  useEffect(() => {
    if (isComplete && messages.length > 0) {
      const totalDuration = Math.floor((Date.now() - startTime) / 1000);
      const answers = [];
      let qIndex = 0;
      for (const msg of messages) {
        if (msg.type === 'question') {
          qIndex = answers.length;
          answers.push({ question: msg.text, text: '' });
        } else if (msg.type === 'answer' && answers[qIndex]) {
          answers[qIndex].text = msg.text;
        }
      }
      onSessionEnd(answers.filter((a) => a.text), totalDuration);
    }
  }, [isComplete]);

  return (
    <div className="interview-session">
      {/* Header */}
      <div className="session-header">
        <div className="session-progress">
          {t('progress')} {Math.min(currentIndex + 1, questions.length)} / {questions.length}
        </div>
        <div className="session-timer">{formatTime(elapsed)}</div>
      </div>

      {/* Chat messages */}
      <div className="chat-area">
        {messages.map((msg, i) => {
          const isLastQuestion = msg.type === 'question' && i === messages.length - 1;
          return (
          <div key={i} className={`chat-message ${msg.type}`}>
            {msg.type === 'question' && (
              <div className="message-bubble question-bubble">
                <span className="message-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4zm2 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>
                  {t('interviewer')}
                </span>
                <p>{isLastQuestion ? typingText : msg.text}{isLastQuestion && !typingDone && <span className="typing-cursor">|</span>}</p>
                {msg.audio && (
                  <button
                    className="play-btn"
                    onClick={() => {
                      const a = new Audio(msg.audio);
                      a.play().catch(() => {});
                    }}
                    title={t('replay')}
                  >
                    {t('replay')}
                  </button>
                )}
              </div>
            )}
            {msg.type === 'answer' && (
              <div className="message-bubble answer-bubble">
                <span className="message-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  {t('you')}
                </span>
                <p>{msg.text}</p>
                {msg.timeTaken && (
                  <span className="time-taken">{formatTime(msg.timeTaken)}</span>
                )}
              </div>
            )}
          </div>
          );
        })}

        {isComplete && (
          <div className="chat-message system">
            <div className="message-bubble system-bubble">
              {t('session_complete')}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      {!isComplete && typingDone && !waitingNext && (
        <div className="input-area">
          <div className="input-tabs">
            <button
              className={inputMode === 'text' ? 'active' : ''}
              onClick={() => setInputMode('text')}
            >
              {t('tab_text')}
            </button>
            <button
              className={inputMode === 'audio' ? 'active' : ''}
              onClick={() => setInputMode('audio')}
            >
              {t('tab_audio')}
            </button>
          </div>

          {inputMode === 'text' ? (
            <div className="text-input-row">
              <textarea
                placeholder={t('placeholder_answer')}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit();
                  }
                }}
              />
              <button
                className="btn btn-primary send-btn"
                onClick={handleTextSubmit}
                disabled={!inputText.trim()}
              >
                {t('btn_send')}
              </button>
            </div>
          ) : (
            <div className="audio-input-row">
              {transcribing ? (
                <p className="transcribing-status">{t('transcribing')}</p>
              ) : (
                <>
                  <button
                    className={`record-btn ${recording ? 'recording' : ''}`}
                    onClick={recording ? stopRecording : startRecording}
                  >
                    {recording ? t('btn_stop') : t('btn_record')}
                  </button>
                  {recording && <span className="recording-indicator">{t('recording')}</span>}
                </>
              )}
              {audioError && <p className="audio-error">{audioError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InterviewSession;
