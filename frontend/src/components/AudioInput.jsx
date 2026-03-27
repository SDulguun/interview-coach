import { useState, useRef } from 'react';

function AudioInput({ onAudioAnalyze, disabled }) {
  const [recording, setRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        setHasRecording(true);

        if (onAudioAnalyze) {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          onAudioAnalyze(formData);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Could not access microphone. Please allow microphone permissions.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  return (
    <div className="audio-input">
      <div className="record-area">
        <button
          className={`record-btn ${recording ? 'recording' : ''}`}
          onClick={toggleRecording}
          disabled={disabled}
          title={recording ? 'Stop recording' : 'Start recording'}
        >
          {recording ? '⏹' : '🎤'}
        </button>

        <p className={`record-status ${recording ? 'active' : ''}`}>
          {recording
            ? 'Recording... Click to stop'
            : hasRecording
              ? 'Recording sent for analysis'
              : 'Click to start recording'}
        </p>
      </div>
    </div>
  );
}

export default AudioInput;
