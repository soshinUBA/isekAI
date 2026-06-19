export default function TopNav() {
  return (
    <nav className="h-14 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#1E2229' }}>
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">FF</span>
        </div>
        <span className="text-white font-semibold text-lg hidden sm:block">
          Fonts Followup
        </span>
      </div>

      {/* Right: Profile */}
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">SR</span>
        </div>
        <span className="text-white text-sm hidden sm:block">Sales Rep</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </nav>
  );
}
