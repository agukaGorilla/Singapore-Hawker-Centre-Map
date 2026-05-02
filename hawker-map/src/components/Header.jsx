import React from 'react';

const Header = ({ stats, searchTerm, setSearchTerm, viewMode, setViewMode, showOnlySelected, setShowOnlySelected, showBoundaries, setShowBoundaries, activeRegions, setActiveRegions }) => {
  const toggleAll = () => setActiveRegions(activeRegions.length === 0 ? ["South & Central Area", "East Area", "West Area", "North Area", "North-East Area"] : []);

  return (
    <header className="p-5 bg-white shadow-md sticky top-0 z-[2000] flex flex-col lg:flex-row gap-5 items-center justify-between">
      <div className="flex-1 w-full lg:w-auto">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">Singapore Hawker Explorer</h1>
        <div className="flex flex-wrap gap-3">
          <span className="text-xs bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-100 font-black uppercase tracking-wider shadow-sm">Visible: {stats.total}</span>
          <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-100 font-black uppercase tracking-wider shadow-sm">Total Stalls: {stats.stalls}</span>
          <button onClick={toggleAll} className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full border border-gray-300 font-black uppercase tracking-tighter transition-colors">
            {activeRegions.length === 0 ? "Show All Markers" : "Hide All Markers"}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
        <div className="flex gap-4 bg-gray-50 p-2.5 rounded-xl border border-gray-200 shadow-inner">
          <label className="flex items-center cursor-pointer gap-2 text-sm font-black text-gray-700">
            Only Selected <input type="checkbox" className="w-4 h-4" checked={showOnlySelected} onChange={(e) => setShowOnlySelected(e.target.checked)} />
          </label>
          <div className="w-[1px] h-5 bg-gray-300 mx-1"></div>
          <label className="flex items-center cursor-pointer gap-2 text-sm font-black text-gray-700">
            Region Lines <input type="checkbox" className="w-4 h-4" checked={showBoundaries} onChange={(e) => setShowBoundaries(e.target.checked)} />
          </label>
        </div>

        <input type="text" placeholder="Search Maxwell, 069184..." className="w-full sm:w-72 p-3 border-2 border-gray-200 rounded-xl outline-none text-base font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm" disabled={showOnlySelected} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        
        <select className="p-3 border-2 border-gray-200 rounded-xl bg-white outline-none cursor-pointer text-base font-black text-gray-800 shadow-sm" value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
          <option value="pins">📍 Standard Pins</option>
          <option value="density">🔴 Density Map</option>
          <option value="cluster">💠 Cluster Mode</option>
        </select>
      </div>
    </header>
  );
};

export default Header;