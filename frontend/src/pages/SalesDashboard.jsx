import { useEffect, useState } from "react";
import { getCustomers, getCustomerActivity, getCustomerAnalysis, generateEmail } from "../api";
import CustomerSelector from "../components/agent/CustomerSelector.jsx";
import ActivitySummary from "../components/agent/ActivitySummary.jsx";
import IntentScoreCard from "../components/agent/IntentScoreCard.jsx";
import FontRecommendations from "../components/agent/FontRecommendations.jsx";
import EmailDraft from "../components/agent/EmailDraft.jsx";

export default function SalesDashboard() {
  const [customers, setCustomers] = useState([]);
  const [userId, setUserId] = useState("U1001");
  const [activity, setActivity] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getCustomers().then(setCustomers).catch(console.error); }, []);
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([getCustomerActivity(userId), getCustomerAnalysis(userId)])
      .then(([act, ana]) => { setActivity(act); setAnalysis(ana); setDraft(null); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const onGenerate = () => {
    generateEmail(userId, { sales_rep_name: "Alex from MyFonts" }).then(setDraft).catch(console.error);
  };

  return (
    <div className="agent-dashboard">
      <h1>Fonts Follow-up Agent</h1>
      <CustomerSelector customers={customers} value={userId} onChange={setUserId} />
      {loading && <p className="muted">Loading customer signals...</p>}
      <div className="agent-grid">
        <ActivitySummary activity={activity} />
        <IntentScoreCard analysis={analysis} />
        <FontRecommendations analysis={analysis} />
        <EmailDraft draft={draft} onGenerate={onGenerate} />
      </div>
    </div>
  );
}
