import { Link } from "react-router-dom";

export default function FontCard({ font }) {
  return (
    <Link to={"/fonts/" + font.slug} className="font-card">
      <div className="font-card-specimen" style={{ fontFamily: "Georgia, serif" }}>{font.name}</div>
      <div className="font-card-meta">
        <strong>{font.name}</strong>
        <span>{font.foundry}</span>
        <span className="price">From ${font.price}</span>
      </div>
    </Link>
  );
}
