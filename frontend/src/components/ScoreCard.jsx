function ScoreCard({ label, score }) {
  function getColorClass(value) {
    if (value >= 80) return 'score-green';
    if (value >= 60) return 'score-yellow';
    return 'score-red';
  }

  const colorClass = getColorClass(score);

  return (
    <div className="score-card">
      <div className={`score-circle ${colorClass}`}>
        {Math.round(score)}
      </div>
      <div className="score-label">{label}</div>
    </div>
  );
}

export default ScoreCard;
