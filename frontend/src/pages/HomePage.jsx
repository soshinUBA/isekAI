import { useEffect, useState } from "react";
import { getFonts } from "../api";
import MyFontsHeader from "../components/myfonts/MyFontsHeader.jsx";
import FontCard from "../components/myfonts/FontCard.jsx";

export default function HomePage() {
  const [fonts, setFonts] = useState([]);
  useEffect(() => { getFonts().then(setFonts).catch(console.error); }, []);
  const featured = fonts.filter((f) => f.featured);
  return (
    <div>
      <MyFontsHeader title="Featured typefaces" subtitle="Discover fonts for editorial and branding" />
      <div className="font-grid">{(featured.length ? featured : fonts).slice(0, 8).map((f) => <FontCard key={f.slug} font={f} />)}</div>
    </div>
  );
}
