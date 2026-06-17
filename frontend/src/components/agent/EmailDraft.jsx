export default function EmailDraft({ draft, onGenerate }) {
  return (
    <section className="agent-card">
      <h2>Email draft</h2>
      <button type="button" className="btn primary" onClick={onGenerate}>Generate draft</button>
      {draft && (<><p><strong>{draft.subject}</strong></p><pre className="email-body">{draft.body}</pre><p className="muted">{draft.disclaimer}</p></>)}
    </section>
  );
}
