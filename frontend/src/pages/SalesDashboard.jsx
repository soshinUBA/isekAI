import { useEffect, useState } from "react";
import { getHighIntentQueue, runBatchProcess, updateDraft, sendEmail, getOffersWithCustomers } from "../api";
import ActivitySummary from "../components/agent/ActivitySummary.jsx";
import IntentScoreCard from "../components/agent/IntentScoreCard.jsx";
import FontRecommendations from "../components/agent/FontRecommendations.jsx";
import EmailDraft from "../components/agent/EmailDraft.jsx";

export default function SalesDashboard() {
  const [activeTab, setActiveTab] = useState("high-intent");
  const [queue, setQueue] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

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

  const loadOffers = () => {
    setLoadingOffers(true);
    getOffersWithCustomers()
      .then(setOffers)
      .catch(console.error)
      .finally(() => setLoadingOffers(false));
  };

  useEffect(() => {
    loadQueue();
    loadOffers();
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

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "high-intent" ? "active" : ""}`}
          onClick={() => setActiveTab("high-intent")}
        >
          High Intent Queue
        </button>
        <button
          className={`tab-btn ${activeTab === "recommendations" ? "active" : ""}`}
          onClick={() => setActiveTab("recommendations")}
        >
          Recommended Fonts
        </button>
        <button
          className={`tab-btn ${activeTab === "offers" ? "active" : ""}`}
          onClick={() => { setActiveTab("offers"); loadOffers(); }}
        >
          Offers ({offers.length})
        </button>
      </div>

      {activeTab === "high-intent" && (
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
      )}

      {activeTab === "recommendations" && (
        <div className="recommendations-tab">
          <h2>Customer Font Recommendations</h2>
          {loading && <p className="muted">Loading...</p>}
          {!loading && queue.length === 0 && (
            <p className="muted">No customers processed yet. Run batch process first.</p>
          )}
          <div className="recommendations-grid">
            {queue.map((customer) => (
              <div key={customer.user_id} className="recommendation-card">
                <div className="recommendation-header">
                  <div className="customer-info">
                    <span className="customer-email">{customer.email}</span>
                    <span className="customer-company">{customer.company || "—"}</span>
                  </div>
                  <span className={`intent-badge ${customer.intent_level.toLowerCase().replace(" ", "-")}`}>
                    {customer.intent_score}
                  </span>
                </div>
                <div className="customer-searches">
                  <span className="searches-label">Searched for:</span>
                  <span className="searches-text">
                    {customer.activity?.search_queries?.join(", ") || "—"}
                  </span>
                </div>
                <div className="fonts-list">
                  <h4>Recommended Fonts</h4>
                  {customer.analysis?.recommended_fonts?.length > 0 ? (
                    <ul>
                      {customer.analysis.recommended_fonts.map((font, idx) => (
                        <li key={idx} className="font-item">
                          <div className="font-name-row">
                            <span className="font-name">{font.font_name}</span>
                            {font.score && <span className="font-score">{font.score} pts</span>}
                          </div>
                          <span className="font-reason">{font.reason}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No recommendations</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "offers" && (
        <div className="offers-tab">
          <h2>Fonts On Offer</h2>
          {loadingOffers && <p className="muted">Loading offers...</p>}
          {!loadingOffers && offers.length === 0 && (
            <p className="muted">No offers currently active.</p>
          )}
          <div className="offers-list">
            {offers.map((item) => (
              <div key={item.offer.font_name} className="offer-card">
                <div className="offer-header">
                  <div className="offer-font-info">
                    <span className="offer-font-name">{item.offer.font_name}</span>
                    <span className="offer-label">{item.offer.offer_label}</span>
                  </div>
                  <div className="offer-pricing">
                    <span className="offer-discount">-{item.offer.discount_percent}%</span>
                    <div className="offer-prices">
                      <span className="original-price">${item.offer.original_price.toFixed(2)}</span>
                      <span className="offer-price">${item.offer.offer_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="offer-expires">
                  Offer ends: {new Date(item.offer.offer_ends).toLocaleDateString()}
                </div>
                
                <div className="matched-customers-section">
                  <h4>
                    Matched Customers ({item.matched_customers.length})
                    {item.matched_customers.length > 0 && (
                      <span className="match-hint">— customers with this font recommended</span>
                    )}
                  </h4>
                  {item.matched_customers.length === 0 ? (
                    <p className="muted">No customers have this font in their recommendations</p>
                  ) : (
                    <div className="matched-customers-list">
                      {item.matched_customers.map((customer) => (
                        <div key={customer.user_id} className="matched-customer">
                          <div className="matched-customer-info">
                            <span className="matched-email">{customer.email}</span>
                            <span className="matched-company">{customer.company || "—"}</span>
                          </div>
                          <div className="matched-customer-meta">
                            <span className={`intent-badge small ${customer.intent_level.toLowerCase().replace(" ", "-")}`}>
                              {customer.intent_score}
                            </span>
                            <span className="match-score">{customer.match_score} pts match</span>
                          </div>
                          <div className="match-reason">{customer.match_reason}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
