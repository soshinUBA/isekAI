import { useState, useEffect } from "react";

export default function EmailDraft({ draft, status, sentAt, onSave, onSend, saving, sending }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    if (draft) {
      setSubject(draft.subject || "");
      setBody(draft.body || "");
      setEdited(false);
    }
  }, [draft]);

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
    setEdited(true);
  };

  const handleBodyChange = (e) => {
    setBody(e.target.value);
    setEdited(true);
  };

  const handleSave = () => {
    onSave?.(subject, body);
    setEdited(false);
  };

  const isSent = status === "sent";

  return (
    <section className="agent-card email-draft-card">
      <h2>Email Draft</h2>

      {isSent && (
        <div className="sent-banner">
          <span className="sent-icon">✓</span>
          Sent on {new Date(sentAt).toLocaleString()}
        </div>
      )}

      {!draft && <p className="muted">No email draft available</p>}

      {draft && (
        <>
          <div className="form-group">
            <label htmlFor="email-subject">Subject</label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={handleSubjectChange}
              disabled={isSent}
              className="email-subject-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email-body">Body</label>
            <textarea
              id="email-body"
              value={body}
              onChange={handleBodyChange}
              disabled={isSent}
              rows={10}
              className="email-body-input"
            />
          </div>

          {draft.last_edited && (
            <p className="muted edit-info">
              Last edited: {new Date(draft.last_edited).toLocaleString()}
            </p>
          )}

          {!isSent && (
            <div className="email-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={handleSave}
                disabled={!edited || saving}
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button
                type="button"
                className="btn send"
                onClick={onSend}
                disabled={sending}
              >
                {sending ? "Sending..." : "Send Email"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
