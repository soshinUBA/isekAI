import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFont } from "../api";
import MyFontsHeader from "../components/myfonts/MyFontsHeader.jsx";
import SpecimenPreview from "../components/myfonts/SpecimenPreview.jsx";
import PricingBlock from "../components/myfonts/PricingBlock.jsx";
import MockCartActions from "../components/myfonts/MockCartActions.jsx";

export default function FontDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { getFont(slug).then(setData).catch(console.error); }, [slug]);
  if (!data) return <p className="muted">Loading font...</p>;
  const font = data.font || data;
  return (
    <div>
      <MyFontsHeader title={font.name} subtitle={font.foundry} />
      <SpecimenPreview font={font} metadata={data.metadata} />
      <PricingBlock font={font} />
      <MockCartActions font={font} />
    </div>
  );
}
