import { Link, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import FontDetailPage from "./pages/FontDetailPage.jsx";
import SalesDashboard from "./pages/SalesDashboard.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <nav className="top-nav">
        <Link to="/">MyFonts</Link>
        <Link to="/search">Search</Link>
        <Link to="/agent">Sales Agent</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/fonts/:slug" element={<FontDetailPage />} />
        <Route path="/agent" element={<SalesDashboard />} />
      </Routes>
    </div>
  );
}
