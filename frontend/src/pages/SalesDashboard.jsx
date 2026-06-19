import { useEffect, useState } from "react";
import { getHighIntentQueue, runBatchProcess, updateDraft, sendEmail, getOffersWithCustomers, getNewArrivalRecommendations } from "../api";
import Toast from "../components/ui/Toast";

function KPICard({ title, value, subtitle, trend, trendUp }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {trend && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            trendUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}>
            {trendUp ? "+" : ""}{trend}
          </span>
        )}
      </div>
    </div>
  );
}

function IntentBadge({ score, level, size = "sm" }) {
  const getColor = () => {
    if (score >= 80) return "bg-emerald-500 text-white";
    if (score >= 60) return "bg-blue-500 text-white";
    if (score >= 40) return "bg-amber-500 text-white";
    return "bg-red-500 text-white";
  };
  
  const sizeClasses = size === "lg" 
    ? "px-3 py-1.5 text-sm" 
    : "px-2 py-0.5 text-xs";

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${getColor()} ${sizeClasses}`}>
      {level ? `${level} (${score})` : score}
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === "sent") {
    return <span className="badge-success">Sent</span>;
  }
  return <span className="badge-warning">Pending</span>;
}

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
  const [newArrivalRecs, setNewArrivalRecs] = useState([]);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [toast, setToast] = useState(null);
  const [expandedFonts, setExpandedFonts] = useState({});

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

  const loadNewArrivals = () => {
    setLoadingNewArrivals(true);
    getNewArrivalRecommendations()
      .then(setNewArrivalRecs)
      .catch(console.error)
      .finally(() => setLoadingNewArrivals(false));
  };

  useEffect(() => {
    loadQueue();
    loadOffers();
    loadNewArrivals();
  }, []);

  const selected = queue.find((c) => c.user_id === selectedId);

  useEffect(() => {
    if (selected?.email_draft) {
      setEditSubject(selected.email_draft.subject || "");
      setEditBody(selected.email_draft.body || "");
    }
  }, [selected]);

  const handleProcess = () => {
    setProcessing(true);
    runBatchProcess()
      .then((result) => {
        setToast({ message: `Processed ${result.processed} customers. ${result.high_intent} high-intent found.`, type: "success" });
        loadQueue();
        loadOffers();
        loadNewArrivals();
      })
      .catch((err) => setToast({ message: "Error: " + err.message, type: "error" }))
      .finally(() => setProcessing(false));
  };

  const handleSaveDraft = () => {
    if (!selectedId) return;
    setSaving(true);
    updateDraft(selectedId, { subject: editSubject, body: editBody })
      .then((updated) => {
        setQueue((prev) =>
          prev.map((c) => (c.user_id === updated.user_id ? updated : c))
        );
        setToast({ message: "Draft saved successfully", type: "success" });
      })
      .catch((err) => setToast({ message: "Error saving: " + err.message, type: "error" }))
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
        setToast({ message: "Email marked as sent", type: "success" });
      })
      .catch((err) => setToast({ message: "Error: " + err.message, type: "error" }))
      .finally(() => setSending(false));
  };

  const pendingCount = queue.filter(c => c.status === "pending").length;
  const sentCount = queue.filter(c => c.status === "sent").length;

  const tabs = [
    { id: "high-intent", label: "High Intent Queue", count: queue.length },
    { id: "recommendations", label: "Recommended Fonts" },
    { id: "offers", label: "Offers", count: offers.length },
    { id: "new-arrivals", label: "New Arrivals Recommends", count: newArrivalRecs.length },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage high-intent customers and font recommendations</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={handleProcess}
          disabled={processing}
        >
          {processing ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Run Batch Process
            </>
          )}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="High Intent Customers" 
          value={queue.length} 
          subtitle="Score >= 70"
        />
        <KPICard 
          title="Pending Emails" 
          value={pendingCount}
          subtitle="Awaiting review"
        />
        <KPICard 
          title="Emails Sent" 
          value={sentCount}
          subtitle="This batch"
          trend={sentCount > 0 ? `${Math.round(sentCount / queue.length * 100)}%` : null}
          trendUp
        />
        <KPICard 
          title="Active Offers" 
          value={offers.length}
          subtitle="With matched customers"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "offers") loadOffers();
                if (tab.id === "new-arrivals") loadNewArrivals();
              }}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* High Intent Tab */}
      {activeTab === "high-intent" && (
        <div className="grid grid-cols-12 gap-6">
          {/* Queue List */}
          <div className="col-span-12 lg:col-span-4">
            <div className="card">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Customer Queue</h2>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {loading && (
                  <div className="p-8 text-center text-gray-500">Loading...</div>
                )}
                {!loading && queue.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No high-intent customers found.</p>
                    <p className="text-sm mt-1">Run batch process to analyze customers.</p>
                  </div>
                )}
                {queue.map((customer) => (
                  <div
                    key={customer.user_id}
                    onClick={() => setSelectedId(customer.user_id)}
                    className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${
                      selectedId === customer.user_id
                        ? "bg-indigo-50 border-l-2 border-l-primary"
                        : "hover:bg-gray-50"
                    } ${customer.status === "sent" ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{customer.email}</p>
                        <p className="text-sm text-gray-500 truncate">{customer.company || "—"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <IntentBadge score={customer.intent_score} />
                        <StatusBadge status={customer.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {!selected && (
              <div className="card p-12 text-center text-gray-500">
                Select a customer from the queue to view details
              </div>
            )}
            {selected && (
              <>
                {/* Customer Header */}
                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selected.email}</h2>
                      <p className="text-sm text-gray-500">{selected.company || "No company"}</p>
                    </div>
                    <IntentBadge score={selected.intent_score} level={selected.intent_level} size="lg" />
                  </div>
                </div>

                {/* Activity & Score Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Activity Summary */}
                  <div className="card p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Activity Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Searches</span>
                        <span className="text-gray-900">{selected.activity?.search_queries?.join(", ") || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fonts Viewed</span>
                        <span className="text-gray-900">{selected.activity?.font_pages_viewed?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cart</span>
                        <span className="text-gray-900">{selected.activity?.cart_additions?.join(", ") || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time on Site</span>
                        <span className="text-gray-900">{selected.activity?.time_spent_minutes || 0} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Intent Summary */}
                  <div className="card p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Intent Summary</h3>
                    <p className="text-sm text-gray-600">{selected.analysis?.intent_summary}</p>
                  </div>
                </div>

                {/* Possible Blockers */}
                {selected.analysis?.possible_blockers && (
                  <div className="card p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Possible Blockers</h3>
                    <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                      {selected.analysis.possible_blockers}
                    </p>
                  </div>
                )}

                {/* Recommended Fonts */}
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Recommended Fonts</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.analysis?.recommended_fonts?.map((font, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg px-3 py-2">
                        <span className="font-medium text-indigo-600">{font.font_name}</span>
                        <span className="text-xs text-gray-500 ml-2">{font.score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email Draft */}
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Email Draft</h3>
                    {selected.status === "sent" && (
                      <span className="badge-success">
                        Sent {selected.sent_at && new Date(selected.sent_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        disabled={selected.status === "sent"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        disabled={selected.status === "sent"}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                      />
                    </div>
                    
                    {selected.status !== "sent" && (
                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveDraft}
                          disabled={saving}
                          className="btn-secondary"
                        >
                          {saving ? "Saving..." : "Save Draft"}
                        </button>
                        <button
                          onClick={handleSend}
                          disabled={sending}
                          className="btn-primary bg-emerald-600 hover:bg-emerald-700"
                        >
                          {sending ? "Sending..." : "Send Email"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === "recommendations" && (
        <div>
          {loading && <p className="text-gray-500 text-center py-8">Loading...</p>}
          {!loading && queue.length === 0 && (
            <p className="text-gray-500 text-center py-8">No customers processed yet. Run batch process first.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queue.map((customer) => (
              <div key={customer.user_id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{customer.email}</p>
                    <p className="text-sm text-gray-500">{customer.company || "—"}</p>
                  </div>
                  <IntentBadge score={customer.intent_score} />
                </div>
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Searched for:</p>
                  <p className="text-sm text-gray-700 italic">
                    {customer.activity?.search_queries?.join(", ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Recommended Fonts</p>
                  <div className="space-y-2">
                    {customer.analysis?.recommended_fonts?.slice(0, 3).map((font, idx) => {
                      const fontKey = `${customer.user_id}-${idx}`;
                      const isExpanded = expandedFonts[fontKey];
                      return (
                        <div key={idx} className="bg-gray-50 rounded overflow-hidden">
                          <button
                            onClick={() => setExpandedFonts(prev => ({ ...prev, [fontKey]: !prev[fontKey] }))}
                            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-sm font-medium text-indigo-600 flex items-center gap-1">
                              <svg 
                                className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              {font.font_name}
                            </span>
                            <span className="text-xs text-gray-500">{font.score} pts</span>
                          </button>
                          {isExpanded && font.reason && (
                            <div className="px-3 py-2 bg-indigo-50 border-t border-indigo-100">
                              <p className="text-xs text-gray-600">{font.reason}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offers Tab */}
      {activeTab === "offers" && (
        <div>
          {loadingOffers && <p className="text-gray-500 text-center py-8">Loading offers...</p>}
          {!loadingOffers && offers.length === 0 && (
            <p className="text-gray-500 text-center py-8">No offers currently active.</p>
          )}
          <div className="space-y-6">
            {offers.map((item) => (
              <div key={item.offer.font_name} className="card overflow-hidden">
                {/* Offer Header */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 border-b border-amber-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{item.offer.font_name}</h3>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-semibold rounded">
                        {item.offer.offer_label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">-{item.offer.discount_percent}%</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-400 line-through">${item.offer.original_price.toFixed(2)}</span>
                        <span className="text-lg font-semibold text-emerald-600">${item.offer.offer_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Offer ends: {new Date(item.offer.offer_ends).toLocaleDateString()}
                  </p>
                </div>

                {/* Matched Customers */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Matched Customers ({item.matched_customers.length})
                    {item.matched_customers.length > 0 && (
                      <span className="font-normal text-sm text-gray-500 ml-2">
                        — customers with this font recommended
                      </span>
                    )}
                  </h4>
                  
                  {item.matched_customers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No customers have this font in their recommendations</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {item.matched_customers.map((customer) => (
                        <div key={customer.user_id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{customer.email}</p>
                              <p className="text-xs text-gray-500">{customer.company || "—"}</p>
                            </div>
                            <IntentBadge score={customer.intent_score} />
                          </div>
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{customer.match_reason}</p>
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

      {/* New Arrivals Recommends Tab */}
      {activeTab === "new-arrivals" && (
        <div>
          {loadingNewArrivals && <p className="text-gray-500 text-center py-8">Loading new arrival recommendations...</p>}
          {!loadingNewArrivals && newArrivalRecs.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-gray-500 mt-4">No new arrival recommendations yet.</p>
              <p className="text-sm text-gray-400 mt-1">Run batch process to generate AI-powered recommendations for new fonts.</p>
            </div>
          )}
          <div className="space-y-6">
            {newArrivalRecs.map((customer) => (
              <div key={customer.user_id} className="card overflow-hidden">
                {/* Customer Header */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-indigo-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{customer.email}</h3>
                      <p className="text-sm text-gray-600">{customer.company || "No company"}</p>
                    </div>
                    <IntentBadge score={customer.intent_score} level={customer.intent_level} size="lg" />
                  </div>
                </div>

                {/* New Arrival Recommendations */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Recommended New Arrivals ({customer.new_arrival_recommendations?.length || 0})
                  </h4>
                  
                  {(!customer.new_arrival_recommendations || customer.new_arrival_recommendations.length === 0) ? (
                    <p className="text-gray-500 text-sm">No new font recommendations for this customer.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customer.new_arrival_recommendations.map((rec, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-semibold text-indigo-600">{rec.font_name}</h5>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                {rec.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-lg font-bold text-emerald-600">{rec.match_score}</span>
                              <span className="text-xs text-gray-500">match</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{rec.description}</p>
                          <p className="text-xs text-gray-500 italic mb-2">{rec.reason}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                              Releases: {rec.release_date ? new Date(rec.release_date).toLocaleDateString() : "—"}
                            </span>
                            {rec.price && (
                              <span className="font-semibold text-gray-900">${rec.price.toFixed(2)}</span>
                            )}
                          </div>
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
