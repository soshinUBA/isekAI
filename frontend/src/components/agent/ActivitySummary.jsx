export default function ActivitySummary({ activity }) {
  if (!activity) return null;
  return (
    <section className="agent-card">
      <h2>Activity</h2>
      <ul>
        <li>Searches: {(activity.search_queries || []).join(", ") || "—"}</li>
        <li>Fonts viewed: {(activity.font_pages_viewed || []).length}</li>
        <li>Cart: {(activity.cart_additions || []).join(", ") || "None"}</li>
        <li>Time on site: {activity.time_spent_minutes || 0} min</li>
      </ul>
    </section>
  );
}
