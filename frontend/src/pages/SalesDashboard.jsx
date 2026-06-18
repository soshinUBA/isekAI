import { useEffect, useState } from "react";
import { getHighIntentQueue, runBatchProcess, updateDraft, sendEmail } from "../api";
import ActivitySummary from "../components/agent/ActivitySummary.jsx";
import IntentScoreCard from "../components/agent/IntentScoreCard.jsx";
import FontRecommendations from "../components/agent/FontRecommendations.jsx";
import EmailDraft from "../components/agent/EmailDraft.jsx";

export default function SalesDashboard() {
  const [queue, setQueue] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const loadQueue = () => {
    setLoading(true);
    getHighIntentQueue()
      .then((data) => {
        setQueue(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].user_id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleProcess = () => {
    setProcessing(true);
    runBatchProcess()
      .then((result) => {
        alert(`Processed ${result.processed} customers. ${result.high_intent} high-intent found.`);
        loadQueue();
      })
      .catch((err) => alert("Error: " + err.message))
      .finally(() => setProcessing(false));
  };

  const selected = queue.find((c) => c.user_id === selectedId);

  const handleSaveDraft = (subject, body) => {
    if (!selectedId) return;
    setSaving(true);
    updateDraft(selectedId, { subject, body })
      .then((updated) => {
        setQueue((prev) =>
          prev.map((c) => (c.user_id === updated.user_id ? updated : c))
        );
      })
      .catch((err) => alert("Error saving: " + err.message))
      .finally(() => setSaving(false));
  };

  const handleSend = () => {
    if (!selectedId) return;
    if (!confirm("Mark this email as sent?")) return;
    setSending(true);
    sendEmail(selectedId)
      .then((updated) => {
        setQueue((prev) =>
          prev.map((c) => (c.user_id === updated.user_id ? updated : c))
        );
      })
      .catch((err) => alert("Error: " + err.message))
      .finally(() => setSending(false));
  };

  return (
    <div className="sales-dashboard">
      <header className="dashboard-header">
        <h1>Sales Dashboard</h1>
        <button
          className="btn primary"
          onClick={handleProcess}
          disabled={processing}
        >
          {processing ? "Processing..." : "Run Batch Process"}
        </button>
      </header>

      <div className="dashboard-layout">
        <aside className="queue-panel">
          <h2>High Intent Queue ({queue.length})</h2>
          {loading && <p className="muted">Loading...</p>}
          {!loading && queue.length === 0 && (
            <p className="muted">No high-intent customers. Run batch process first.</p>
          )}
          <ul className="queue-list">
            {queue.map((customer) => (
              <li
                key={customer.user_id}
                className={`queue-item ${selectedId === customer.user_id ? "selected" : ""} ${customer.status === "sent" ? "sent" : ""}`}
                onClick={() => setSelectedId(customer.user_id)}
              >
                <div className="queue-item-main">
                  <span className="queue-email">{customer.email}</span>
                  <span className="queue-company">{customer.company || "—"}</span>
                </div>
                <div className="queue-item-meta">
                  <span className={`intent-badge ${customer.intent_level.toLowerCase().replace(" ", "-")}`}>
                    {customer.intent_score}
                  </span>
                  {customer.status === "sent" && (
                    <span className="status-badge sent">Sent</span>
                  )}
                  {customer.status === "pending" && (
                    <span className="status-badge pending">Pending</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="detail-panel">
          {!selected && (
            <p className="muted center">Select a customer from the queue</p>
          )}
          {selected && (
            <>
              <div className="detail-header">
                <h2>{selected.email}</h2>
                <span className={`intent-badge large ${selected.intent_level.toLowerCase().replace(" ", "-")}`}>
                  {selected.intent_level} ({selected.intent_score})
                </span>
              </div>

              <div className="detail-grid">
                <ActivitySummary activity={selected.activity} />
                <IntentScoreCard analysis={selected.analysis} />
                <FontRecommendations analysis={selected.analysis} />
                <EmailDraft
                  draft={selected.email_draft}
                  status={selected.status}
                  sentAt={selected.sent_at}
                  onSave={handleSaveDraft}
                  onSend={handleSend}
                  saving={saving}
                  sending={sending}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
