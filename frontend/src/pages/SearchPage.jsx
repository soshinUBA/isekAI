import { useEffect, useState } from "react";
import { searchFonts } from "../api";
import FontCard from "../components/myfonts/FontCard.jsx";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [fonts, setFonts] = useState([]);
  useEffect(() => {
    searchFonts({ q, category: category || undefined }).then(setFonts).catch(console.error);
  }, [q, category]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Fonts</h1>
        <p className="text-sm text-gray-500 mt-1">Find the perfect typeface for your project</p>
      </div>
      
      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search fonts..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          <option value="serif">Serif</option>
          <option value="sans">Sans Serif</option>
          <option value="display">Display</option>
        </select>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {fonts.map((f) => <FontCard key={f.slug} font={f} />)}
      </div>
      {fonts.length === 0 && (
        <p className="text-center text-gray-500 py-8">No fonts found matching your criteria</p>
      )}
    </div>
  );
}
