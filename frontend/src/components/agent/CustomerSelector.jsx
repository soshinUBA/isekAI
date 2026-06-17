export default function CustomerSelector({ customers, value, onChange }) {
  return (
    <label className="customer-select">
      Customer
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {customers.map((c) => (
          <option key={c.user_id} value={c.user_id}>{c.name || c.user_id} — {c.email || ""}</option>
        ))}
      </select>
    </label>
  );
}
