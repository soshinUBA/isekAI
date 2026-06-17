export default function FilterBar({ q, category, onQChange, onCategoryChange }) {
  return (
    <div className="filter-bar">
      <input value={q} onChange={(e) => onQChange(e.target.value)} placeholder="Search fonts" />
      <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
        <option value="">All categories</option>
        <option value="serif">Serif</option>
        <option value="sans">Sans</option>
        <option value="display">Display</option>
      </select>
    </div>
  );
}
