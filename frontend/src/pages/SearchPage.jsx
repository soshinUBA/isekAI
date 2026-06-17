import { useEffect, useState } from "react";
import { searchFonts } from "../api";
import MyFontsHeader from "../components/myfonts/MyFontsHeader.jsx";
import FilterBar from "../components/myfonts/FilterBar.jsx";
import FontCard from "../components/myfonts/FontCard.jsx";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [fonts, setFonts] = useState([]);
  useEffect(() => {
    searchFonts({ q, category: category || undefined }).then(setFonts).catch(console.error);
  }, [q, category]);
  return (
    <div>
      <MyFontsHeader title="Search fonts" />
      <FilterBar q={q} category={category} onQChange={setQ} onCategoryChange={setCategory} />
      <div className="font-grid">{fonts.map((f) => <FontCard key={f.slug} font={f} />)}</div>
    </div>
  );
}
