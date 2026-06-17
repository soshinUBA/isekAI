export default function SpecimenPreview({ font, metadata }) {
  const sample = metadata?.mood_tags?.join(", ") || font.category;
  return (
    <section className="specimen">
      <p className="specimen-line" style={{ fontSize: "3rem", fontFamily: "Georgia, serif" }}>{font.name}</p>
      <p className="muted">{sample}</p>
    </section>
  );
}
