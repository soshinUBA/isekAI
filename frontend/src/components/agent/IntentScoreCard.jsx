export default function IntentScoreCard({ analysis }) {
  if (!analysis) return null;
  return (
    <section className="agent-card">
      <h2>
        Intent score
        {analysis.ai_enriched ? (
          <span className="badge badge-ai" title="AI analysis completed">AI</span>
        ) : (
          <span className="badge badge-rule" title="Rule-based scoring only">Rules</span>
        )}
      </h2>
      <p className="score">{analysis.buying_intent_score} — {analysis.intent_level}</p>
      <p>{analysis.intent_summary}</p>
      <p className="action-hint"><strong>Action:</strong> {analysis.recommended_action}</p>
      <ul>{(analysis.score_breakdown || []).map((b) => <li key={b.signal}>{b.signal}: {b.points > 0 ? "+" : ""}{b.points}</li>)}</ul>
    </section>
  );
}
