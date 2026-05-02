import React, { useState, useEffect, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import Header from './components/Header';
import HawkerMap from './components/HawkerMap';
import SelectionPanel from './components/SelectionPanel';

function App() {
  const [hawkers, setHawkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('pins'); 
  const [selectedIds, setSelectedIds] = useState([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [showBoundaries, setShowBoundaries] = useState(false);
  const [activeRegions, setActiveRegions] = useState(["South & Central Area", "East Area", "West Area", "North Area", "North-East Area"]);

  useEffect(() => {
    fetch('/hawkers.json').then(res => res.json()).then(data => setHawkers(data.features || data));
  }, []);

  const filteredHawkers = useMemo(() => {
    return hawkers.filter(item => {
      const props = item.properties || {};
      if (showOnlySelected) return selectedIds.includes(props.NAME);
      const address = props.ADDRESS_MYENV || `${props.ADDRESSBLOCKHOUSENUMBER} ${props.ADDRESSSTREETNAME}`;
      const term = searchTerm.toLowerCase();
      return (props.NAME || "").toLowerCase().includes(term) || (props.ADDRESSPOSTALCODE || "").toLowerCase().includes(term) || address.toLowerCase().includes(term);
    });
  }, [hawkers, searchTerm, showOnlySelected, selectedIds]);

  const stats = useMemo(() => ({
    total: filteredHawkers.length,
    stalls: filteredHawkers.reduce((sum, h) => sum + (h.properties.NUMBER_OF_COOKED_FOOD_STALLS || 0), 0)
  }), [filteredHawkers]);

  const groupedHawkers = useMemo(() => {
    return filteredHawkers.reduce((acc, hawker) => {
      const sector = parseInt((hawker.properties.ADDRESSPOSTALCODE || "00").toString().substring(0, 2), 10);
      let region = "North-East Area";
      if (sector >= 1 && sector <= 33) region = "South & Central Area";
      else if (sector >= 34 && sector <= 52) region = "East Area";
      else if (sector >= 58 && sector <= 71) region = "West Area";
      else if (sector >= 72 && sector <= 78) region = "North Area";
      if (!acc[region]) acc[region] = [];
      acc[region].push(hawker);
      return acc;
    }, {});
  }, [filteredHawkers]);

  const toggleSelection = (name) => setSelectedIds(prev => prev.includes(name) ? prev.filter(id => id !== name) : [...prev, name]);

  if (hawkers.length === 0) return null;

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-100 overflow-hidden">
      <Header 
        stats={stats} 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showOnlySelected={showOnlySelected}
        setShowOnlySelected={setShowOnlySelected}
        showBoundaries={showBoundaries}
        setShowBoundaries={setShowBoundaries}
        activeRegions={activeRegions}
        setActiveRegions={setActiveRegions}
      />
      
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <HawkerMap 
          groupedHawkers={groupedHawkers}
          filteredHawkers={filteredHawkers}
          viewMode={viewMode}
          selectedIds={selectedIds}
          toggleSelection={toggleSelection}
          showBoundaries={showBoundaries}
          activeRegions={activeRegions}
          setActiveRegions={setActiveRegions}
          showOnlySelected={showOnlySelected}
        />

        <SelectionPanel 
          selectedIds={selectedIds} 
          toggleSelection={toggleSelection} 
          clearAll={() => {setSelectedIds([]); setShowOnlySelected(false);}}
        />
      </div>
    </div>
  );
}

export default App;