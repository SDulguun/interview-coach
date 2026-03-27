function FeedbackPanel({ results }) {
  if (!results || !results.feedback) return null;

  const { feedback } = results;
  const strengths = feedback.strengths || [];
  const improvements = feedback.areas_to_improve || feedback.improvements || [];
  const suggestions = feedback.suggestions || [];

  if (strengths.length === 0 && improvements.length === 0 && suggestions.length === 0) {
    return null;
  }

  return (
    <div className="card feedback-panel">
      <h2>Detailed Feedback</h2>

      {strengths.length > 0 && (
        <div className="feedback-section feedback-strengths">
          <h3>Strengths</h3>
          <ul>
            {strengths.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {improvements.length > 0 && (
        <div className="feedback-section feedback-improvements">
          <h3>Areas to Improve</h3>
          <ul>
            {improvements.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="feedback-section feedback-suggestions">
          <h3>Suggestions</h3>
          <ul>
            {suggestions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FeedbackPanel;
