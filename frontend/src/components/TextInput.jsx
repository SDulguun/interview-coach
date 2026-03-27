import { useState } from 'react';

function TextInput({ onAnalyze, disabled }) {
  const [text, setText] = useState('');

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  function handleAnalyze() {
    if (text.trim() && onAnalyze) {
      onAnalyze(text.trim());
    }
  }

  return (
    <div className="text-input">
      <textarea
        placeholder="Type your interview response here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />
      <div className="input-footer">
        <span className="word-count">{wordCount} words</span>
        <button
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={disabled || !text.trim()}
        >
          {disabled ? 'Analyzing...' : 'Analyze Response'}
        </button>
      </div>
    </div>
  );
}

export default TextInput;
