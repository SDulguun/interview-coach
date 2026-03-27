import ScoreCard from './ScoreCard';

const SCORE_LABELS = {
  word_count: 'Word Count',
  filler: 'Filler Words',
  ttr: 'Vocabulary',
  structure: 'Structure',
  relevance: 'Relevance',
};

function ResultsDashboard({ results }) {
  if (!results || !results.feedback) return null;

  const { feedback, metrics, transcription } = results;
  const overall = feedback.overall_score ?? 0;
  const dimensionScores = feedback.dimension_scores || {};

  function getOverallColor(value) {
    if (value >= 80) return 'var(--green)';
    if (value >= 60) return 'var(--yellow)';
    return 'var(--red)';
  }

  return (
    <div className="card results-dashboard">
      <h2>Analysis Results</h2>

      {transcription && (
        <div className="transcription-box">
          <strong>Transcription:</strong> {transcription}
        </div>
      )}

      <div className="overall-score">
        <div
          className="score-value"
          style={{ color: getOverallColor(overall) }}
        >
          {Math.round(overall)}
        </div>
        <div className="score-label">Overall Score</div>
      </div>

      <div className="score-grid">
        {Object.entries(dimensionScores).map(([key, value]) => (
          <ScoreCard
            key={key}
            label={SCORE_LABELS[key] || key.replace(/_/g, ' ')}
            score={value}
          />
        ))}
      </div>

      {metrics && metrics.text && (
        <div className="metrics-summary">
          <span>Words: {metrics.text.word_count}</span>
          <span>Sentences: {metrics.text.sentence_count}</span>
          <span>TTR: {metrics.text.ttr?.toFixed(2)}</span>
          <span>Fillers: {metrics.fillers?.total_count ?? 0}</span>
          <span>Action Verbs: {metrics.structure?.action_verbs?.count ?? 0}</span>
        </div>
      )}
    </div>
  );
}

export default ResultsDashboard;
