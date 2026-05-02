import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapContainer, TileLayer, Marker, Popup, Tooltip, 
  LayersControl, FeatureGroup, useMap, Polygon 
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Region Coordinates: Perfectly interlocking at 103.75 for the West/Central divide
const regionBoundaries = {
  "Central": { color: "#3b82f6", coords: [[1.24, 103.75], [1.35, 103.75], [1.35, 103.87], [1.29, 103.87], [1.24, 103.83]] },
  "East": { color: "#10b981", coords: [[1.29, 103.87], [1.34, 103.87], [1.40, 103.93], [1.40, 104.02], [1.29, 104.02]] },
  "North": { color: "#ef4444", coords: [[1.35, 103.75], [1.48, 103.75], [1.48, 103.87], [1.35, 103.87]] },
  "West": { color: "#f59e0b", coords: [[1.18, 103.60], [1.46, 103.60], [1.46, 103.75], [1.18, 103.75]] },
  "North-East": { color: "#8b5cf6", coords: [[1.48, 103.87], [1.40, 103.92], [1.34, 103.87], [1.35, 103.87], [1.48, 103.87]] }
};

let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
const SelectedPinIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41], className: 'hue-rotate-[140deg] brightness-110 drop-shadow-md' });

function MapBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.geometry.coordinates[1], m.geometry.coordinates[0]]));
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
    }
  }, [markers, map]);
  return null;
}

const getCustomIcon = (stalls, isNew, isSelected) => {
  const size = Math.max(28, Math.min(85, 24 + (stalls * 0.3))); // Slightly larger base size
  const bgClass = isNew ? 'bg-amber-500' : 'bg-blue-600';
  const borderClass = isSelected ? 'border-[4px] border-red-500 ring-2 ring-white' : 'border-[3px] border-white';
  const htmlString = `<div class="${bgClass} ${borderClass} rounded-full shadow-lg flex items-center justify-center opacity-90 transition-all hover:scale-110" style="width: ${size}px; height: ${size}px;"><span class="text-white font-black" style="font-size: ${Math.max(12, size / 3)}px;">${stalls > 0 ? stalls : ''}</span></div>`;
  return L.divIcon({ html: htmlString, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
};

// IMPROVED: Larger text and better padding for the cards
const HawkerCard = ({ props, address }) => (
  <div className="p-2 w-72 flex flex-col gap-2 whitespace-normal overflow-hidden leading-relaxed">
    {props.PHOTOURL && <img src={props.PHOTOURL} alt={props.NAME} className="w-full h-40 object-cover rounded shadow-sm border border-gray-200" />}
    <h2 className="font-black text-lg border-b border-gray-200 pb-2 mb-1 text-gray-900 leading-tight">{props.NAME}</h2>
    <p className="text-sm text-gray-800 leading-snug"><strong>Address:</strong> {address}</p>
    <div className="flex justify-between items-center mt-1 bg-gray-50 p-2 rounded">
      <p className="text-sm text-gray-700 font-mono font-bold">{props.ADDRESSPOSTALCODE}</p>
      <span className="bg-blue-700 text-white font-black py-1 px-3 rounded text-xs tracking-wide">STALLS: {props.NUMBER_OF_COOKED_FOOD_STALLS || 0}</span>
    </div>
  </div>
);

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

  const getAddress = (p) => p.ADDRESS_MYENV || (p.ADDRESSBLOCKHOUSENUMBER || p.ADDRESSSTREETNAME ? `${p.ADDRESSBLOCKHOUSENUMBER || ""} ${p.ADDRESSSTREETNAME || ""}`.trim() : "N/A");

  const filteredHawkers = useMemo(() => {
    return hawkers.filter(item => {
      const props = item.properties || {};
      if (showOnlySelected) return selectedIds.includes(props.NAME);
      const address = getAddress(props);
      const term = searchTerm.toLowerCase();
      return (props.NAME || "").toLowerCase().includes(term) || (props.ADDRESSPOSTALCODE || "").toLowerCase().includes(term) || address.toLowerCase().includes(term);
    });
  }, [hawkers, searchTerm, showOnlySelected, selectedIds]);

  const stats = useMemo(() => {
    const totalStalls = filteredHawkers.reduce((sum, h) => sum + (h.properties.NUMBER_OF_COOKED_FOOD_STALLS || 0), 0);
    return { total: filteredHawkers.length, stalls: totalStalls };
  }, [filteredHawkers]);

  if (hawkers.length === 0) return null;

  const groupedHawkers = filteredHawkers.reduce((acc, hawker) => {
    const sector = parseInt((hawker.properties.ADDRESSPOSTALCODE || "00").toString().substring(0, 2), 10);
    let region = "North-East Area";
    // Adam Road (Sector 28) correctly stays in South & Central
    if (sector >= 1 && sector <= 33) region = "South & Central Area";
    else if (sector >= 34 && sector <= 52) region = "East Area";
    else if (sector >= 58 && sector <= 71) region = "West Area";
    else if (sector >= 72 && sector <= 78) region = "North Area";
    if (!acc[region]) acc[region] = [];
    acc[region].push(hawker);
    return acc;
  }, {});

  const toggleSelection = (name) => setSelectedIds(prev => prev.includes(name) ? prev.filter(id => id !== name) : [...prev, name]);

  const toggleAllMarkers = () => {
    if (activeRegions.length === 0) {
      setActiveRegions(["South & Central Area", "East Area", "West Area", "North Area", "North-East Area"]);
    } else {
      setActiveRegions([]);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-100 overflow-hidden">
      {/* HEADER: Increased font sizes for title and labels */}
      <header className="p-5 bg-white shadow-md sticky top-0 z-[2000] flex flex-col lg:flex-row gap-5 items-center justify-between">
        <div className="flex-1 w-full lg:w-auto">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">Singapore Hawker Explorer</h1>
          <div className="flex flex-wrap gap-3">
            <span className="text-xs bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-100 font-black uppercase tracking-wider shadow-sm">Visible: {stats.total}</span>
            <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-100 font-black uppercase tracking-wider shadow-sm">Total Stalls: {stats.stalls}</span>
            <button 
              onClick={toggleAllMarkers}
              className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full border border-gray-300 font-black uppercase tracking-tighter transition-colors"
            >
              {activeRegions.length === 0 ? "Show All Markers" : "Hide All Markers"}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
          <div className="flex gap-4 bg-gray-50 p-2.5 rounded-xl border border-gray-200 shadow-inner">
            <label className="flex items-center cursor-pointer gap-2 text-sm font-black text-gray-700">
              Only Selected
              <input type="checkbox" className="w-4 h-4" checked={showOnlySelected} onChange={(e) => setShowOnlySelected(e.target.checked)} />
            </label>
            <div className="w-[1px] h-5 bg-gray-300 mx-1"></div>
            <label className="flex items-center cursor-pointer gap-2 text-sm font-black text-gray-700">
              Region Lines
              <input type="checkbox" className="w-4 h-4" checked={showBoundaries} onChange={(e) => setShowBoundaries(e.target.checked)} />
            </label>
          </div>

          <input 
            type="text" 
            placeholder="Search Maxwell, 069184..." 
            className="w-full sm:w-72 p-3 border-2 border-gray-200 rounded-xl outline-none text-base font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm" 
            disabled={showOnlySelected} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          
          <select 
            className="p-3 border-2 border-gray-200 rounded-xl bg-white outline-none cursor-pointer text-base font-black text-gray-800 shadow-sm" 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="pins">📍 Standard Pins</option>
            <option value="density">🔴 Density Map</option>
            <option value="cluster">💠 Cluster Mode</option>
          </select>
        </div>
      </header>

      <div className="flex-1 relative flex flex-col overflow-hidden">
        <MapContainer center={[1.3521, 103.8198]} zoom={12} className="flex-1 w-full z-10">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
          <MapBounds markers={filteredHawkers} />
          
          {showBoundaries && Object.entries(regionBoundaries).map(([name, data]) => (
            <Polygon key={name} positions={data.coords} pathOptions={{ color: data.color, fillColor: data.color, fillOpacity: 0.15, weight: 4 }}>
              <Tooltip sticky className="font-black text-sm uppercase">{name} Region</Tooltip>
            </Polygon>
          ))}

          <LayersControl position="topright">
            {Object.entries(groupedHawkers).map(([region, centres]) => (
              <LayersControl.Overlay 
                checked={activeRegions.includes(region)} 
                name={region} 
                key={region}
                eventHandlers={{
                  add: () => setActiveRegions(prev => [...prev, region]),
                  remove: () => setActiveRegions(prev => prev.filter(r => r !== region))
                }}
              >
                <FeatureGroup>
                  {/* FIX: disableClusteringAtZoom is 0 for non-cluster modes to show ALL markers */}
                  <MarkerClusterGroup 
                    disableClusteringAtZoom={viewMode === 'cluster' ? 17 : 0} 
                    chunkedLoading 
                    key={`${viewMode}-${centres.length}-${activeRegions.length}`}
                  >
                    {centres.map((hawker, index) => {
                      const p = hawker.properties;
                      const isSelected = selectedIds.includes(p.NAME);
                      const isNew = (p.STATUS || "").toLowerCase().includes("new");

                      return (
                        <Marker key={index} position={[hawker.geometry.coordinates[1], hawker.geometry.coordinates[0]]} 
                          icon={viewMode === 'density' ? getCustomIcon(p.NUMBER_OF_COOKED_FOOD_STALLS, isNew, isSelected) : (isSelected ? SelectedPinIcon : DefaultIcon)}
                          opacity={viewMode === 'pins' && isNew ? 0.6 : 1.0}
                          eventHandlers={{ click: () => toggleSelection(p.NAME) }}
                        >
                          <Tooltip direction="top" opacity={1}><HawkerCard props={p} address={getAddress(p)} /></Tooltip>
                          <Popup maxWidth={320}><HawkerCard props={p} address={getAddress(p)} /></Popup>
                        </Marker>
                      );
                    })}
                  </MarkerClusterGroup>
                </FeatureGroup>
              </LayersControl.Overlay>
            ))}
          </LayersControl>
        </MapContainer>

        {/* SELECTION PANEL: Improved spacing and text size */}
        {selectedIds.length > 0 && (
          <div className="bg-white border-t border-gray-300 p-5 max-h-48 overflow-y-auto z-[3000] shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Selected Centres ({selectedIds.length})</h3>
              <button 
                onClick={() => {setSelectedIds([]); setShowOnlySelected(false);}} 
                className="text-red-600 hover:text-white hover:bg-red-600 font-black border-2 border-red-200 px-4 py-1.5 rounded-full text-xs transition-all"
              >
                CLEAR ALL SELECTIONS
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {selectedIds.map(name => (
                <div key={name} className="bg-blue-600 text-white pl-4 pr-2 py-2 rounded-full text-sm flex items-center gap-3 font-bold shadow-md hover:bg-blue-700 transition-colors">
                  {name}
                  <button onClick={() => toggleSelection(name)} className="bg-blue-500 hover:bg-red-500 rounded-full w-6 h-6 flex items-center justify-center text-lg leading-none transition-colors">&times;</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;