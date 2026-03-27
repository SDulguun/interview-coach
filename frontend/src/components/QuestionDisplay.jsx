import { useState, useEffect, useRef } from 'react';
import { getSampleQuestions } from '../api';

function QuestionDisplay({ question, onQuestionChange }) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const audioRef = useRef(null);

  function playQuestion() {
    const audioSrc = question?.audio;
    if (!audioSrc) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioSrc);
    audioRef.current = audio;
    audio.onplay = () => setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audio.play().catch(() => setPlaying(false));
  }

  function stopPlaying() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(false);
    }
  }

  // Auto-play when question changes
  useEffect(() => {
    if (autoPlay && question?.audio) {
      const timer = setTimeout(() => playQuestion(), 300);
      return () => clearTimeout(timer);
    }
  }, [question]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  async function handleRandomQuestion() {
    setLoading(true);
    try {
      const data = await getSampleQuestions();
      const questions = data.questions || data || [];
      if (questions.length > 0) {
        const random = questions[Math.floor(Math.random() * questions.length)];
        onQuestionChange(random);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  }

  function getQuestionText() {
    if (!question) return '';
    return question.question || question.text || (typeof question === 'string' ? question : '');
  }

  return (
    <div className="card question-display">
      <h2>Interview Question</h2>

      {question ? (
        <>
          <div className="question-text">{getQuestionText()}</div>
          <div className="question-meta">
            {question.category && (
              <span className="category-badge">{question.category}</span>
            )}
            {question.tip && (
              <span className="tip">{question.tip}</span>
            )}
          </div>
          {question.audio && (
            <div className="question-actions">
              <button
                className={`btn ${playing ? 'btn-speaking' : 'btn-secondary'}`}
                onClick={playing ? stopPlaying : playQuestion}
                title={playing ? 'Stop' : 'Listen to question'}
              >
                {playing ? 'Stop' : 'Listen'}
              </button>
              <label className="auto-speak-toggle">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                />
                Auto-play
              </label>
            </div>
          )}
        </>
      ) : (
        <p style={{ color: '#9ca3af', marginBottom: 12 }}>
          Click the button below to get a random interview question.
        </p>
      )}

      <button
        className="btn btn-secondary"
        onClick={handleRandomQuestion}
        disabled={loading}
        style={{ marginTop: question ? 8 : 0 }}
      >
        {loading ? 'Loading...' : 'Get Random Question'}
      </button>
    </div>
  );
}

export default QuestionDisplay;
