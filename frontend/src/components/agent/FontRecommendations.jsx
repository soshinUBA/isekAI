export default function FontRecommendations({ analysis }) {
  if (!analysis) return null;
  return (
    <section className="agent-card">
      <h2>Recommended fonts</h2>
      <ul>{(analysis.recommended_fonts || []).map((f) => <li key={f.font_name}><strong>{f.font_name}</strong> — {f.reason}</li>)}</ul>
    </section>
  );
}
