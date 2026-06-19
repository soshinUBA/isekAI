import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { getHighIntentQueue, getOffersWithCustomers } from "../../api";

const navItems = [
  {
    name: "Dashboard",
    path: "/agent",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
];

const bottomItems = [
  {
    name: "Settings",
    path: "/settings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const [stats, setStats] = useState({
    highIntent: 0,
    pending: 0,
    offers: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [queue, offers] = await Promise.all([
          getHighIntentQueue(),
          getOffersWithCustomers(),
        ]);
        setStats({
          highIntent: queue.length,
          pending: queue.filter((c) => c.status === "pending").length,
          offers: offers.length,
        });
      } catch (err) {
        console.error("Failed to load sidebar stats:", err);
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-60 bg-white border-r border-gray-200 fixed left-0 top-14 bottom-0 flex flex-col">
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/agent"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Quick Stats
          </h3>
          <div className="mt-3 px-3 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">High Intent</span>
              <span className="font-semibold text-gray-900">{stats.highIntent}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Pending Emails</span>
              <span className="font-semibold text-amber-600">{stats.pending}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Active Offers</span>
              <span className="font-semibold text-emerald-600">{stats.offers}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="border-t border-gray-200 px-3 py-4">
        <ul className="space-y-1">
          {bottomItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
