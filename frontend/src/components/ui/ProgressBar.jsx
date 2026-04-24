function scoreToColor(score) {
  if (score >= 80) return 'green';
  if (score >= 60) return '';
  return 'amber';
}

function ProgressBar({ value = 0, color, score, width, className = '', style = {} }) {
  const clamped = Math.max(0, Math.min(100, value));
  const cls = color ?? (typeof score === 'number' ? scoreToColor(score) : '');
  return (
    <div
      className={['progress-bar', className].filter(Boolean).join(' ')}
      style={{ width, ...style }}
    >
      <div
        className={['progress-bar-fill', cls].filter(Boolean).join(' ')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default ProgressBar;
