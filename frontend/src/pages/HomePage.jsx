import { useEffect, useState } from "react";
import { getFonts } from "../api";
import FontCard from "../components/myfonts/FontCard.jsx";

export default function HomePage() {
  const [fonts, setFonts] = useState([]);
  useEffect(() => { getFonts().then(setFonts).catch(console.error); }, []);
  const featured = fonts.filter((f) => f.featured);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Featured Typefaces</h1>
        <p className="text-sm text-gray-500 mt-1">Discover fonts for editorial and branding</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(featured.length ? featured : fonts).slice(0, 8).map((f) => <FontCard key={f.slug} font={f} />)}
      </div>
    </div>
  );
}
