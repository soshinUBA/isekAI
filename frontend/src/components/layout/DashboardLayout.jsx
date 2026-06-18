import TopNav from "./TopNav";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F5F7' }}>
      <TopNav />
      <Sidebar />
      <main className="ml-60 pt-14 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
