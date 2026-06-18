import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import FontDetailPage from "./pages/FontDetailPage.jsx";
import SalesDashboard from "./pages/SalesDashboard.jsx";
import DashboardLayout from "./components/layout/DashboardLayout.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout><HomePage /></DashboardLayout>} />
      <Route path="/search" element={<DashboardLayout><SearchPage /></DashboardLayout>} />
      <Route path="/fonts/:slug" element={<DashboardLayout><FontDetailPage /></DashboardLayout>} />
      <Route path="/agent" element={<DashboardLayout><SalesDashboard /></DashboardLayout>} />
    </Routes>
  );
}
