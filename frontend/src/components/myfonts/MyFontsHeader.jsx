export default function MyFontsHeader({ title, subtitle }) {
  return (
    <header className="mf-header">
      <p className="mf-brand">MyFonts</p>
      <h1>{title}</h1>
      {subtitle && <p className="mf-subtitle">{subtitle}</p>}
    </header>
  );
}
