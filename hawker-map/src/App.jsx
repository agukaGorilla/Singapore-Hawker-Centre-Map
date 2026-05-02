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

const regionBoundaries = {
  "Central": { color: "#3b82f6", coords: [[1.24, 103.75], [1.35, 103.75], [1.35, 103.87], [1.29, 103.87], [1.24, 103.83]] },
  "East": { color: "#10b981", coords: [[1.29, 103.87], [1.34, 103.87], [1.40, 103.93], [1.40, 104.02], [1.29, 104.02]] },
  "North": { color: "#ef4444", coords: [[1.35, 103.75], [1.48, 103.75], [1.48, 103.87], [1.35, 103.87]] },
  "West": { color: "#f59e0b", coords: [[1.18, 103.60], [1.46, 103.60], [1.46, 103.75], [1.18, 103.75]] },
  "North-East": { color: "#8b5cf6", coords: [[1.48, 103.87], [1.40, 103.93], [1.34, 103.87], [1.35, 103.87], [1.48, 103.87]] }
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
  const size = Math.max(24, Math.min(75, 20 + (stalls * 0.25))); 
  const bgClass = isNew ? 'bg-amber-500' : 'bg-blue-600';
  const borderClass = isSelected ? 'border-[4px] border-red-500 ring-2 ring-white' : 'border-[3px] border-white';
  const htmlString = `<div class="${bgClass} ${borderClass} rounded-full shadow-lg flex items-center justify-center opacity-90 transition-all hover:scale-110" style="width: ${size}px; height: ${size}px;"><span class="text-white font-bold" style="font-size: ${Math.max(9, size / 3.5)}px;">${stalls > 0 ? stalls : ''}</span></div>`;
  return L.divIcon({ html: htmlString, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
};

const HawkerCard = ({ props, address }) => (
  <div className="p-1 w-64 flex flex-col gap-1.5 whitespace-normal overflow-hidden leading-snug">
    {props.PHOTOURL && <img src={props.PHOTOURL} alt={props.NAME} className="w-full h-32 object-cover rounded shadow-sm border border-gray-200" />}
    <h2 className="font-bold text-sm border-b border-gray-200 pb-1 mb-1 text-gray-800">{props.NAME}</h2>
    <p className="text-[11px] text-gray-700"><strong>Address:</strong> {address}</p>
    <div className="flex justify-between items-center mt-1">
      <p className="text-[11px] text-gray-700 font-mono">{props.ADDRESSPOSTALCODE}</p>
      <span className="bg-blue-600 text-white font-bold py-0.5 px-1.5 rounded text-[10px]">Stalls: {props.NUMBER_OF_COOKED_FOOD_STALLS || 0}</span>
    </div>
  </div>
);

function App() {
  const [hawkers, setHawkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('pins'); 
  const [selectedIds, setSelectedIds] = useState([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  
  // NEW: State for the Boundaries and Region Toggle
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
    if (sector >= 1 && sector <= 33) region = "South & Central Area";
    else if (sector >= 34 && sector <= 52) region = "East Area";
    else if (sector >= 58 && sector <= 71) region = "West Area";
    else if (sector >= 72 && sector <= 78) region = "North Area";
    if (!acc[region]) acc[region] = [];
    acc[region].push(hawker);
    return acc;
  }, {});

  const toggleSelection = (name) => setSelectedIds(prev => prev.includes(name) ? prev.filter(id => id !== name) : [...prev, name]);

  // NEW: Bulk action for all markers
  const toggleAllMarkers = () => {
    if (activeRegions.length === 0) {
      setActiveRegions(["South & Central Area", "East Area", "West Area", "North Area", "North-East Area"]);
    } else {
      setActiveRegions([]);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-100 overflow-hidden text-sm">
      <header className="p-4 bg-white shadow-md sticky top-0 z-[2000] flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800 leading-tight">SG Hawker Explorer</h1>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-bold uppercase">Centres: {stats.total}</span>
            <button 
              onClick={toggleAllMarkers}
              className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded border border-gray-300 font-bold uppercase"
            >
              {activeRegions.length === 0 ? "Show All Markers" : "Hide All Markers"}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm">
            <label className="flex items-center cursor-pointer gap-2 text-xs font-bold text-gray-600">
              Only Selected
              <input type="checkbox" checked={showOnlySelected} onChange={(e) => setShowOnlySelected(e.target.checked)} />
            </label>
            <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
            <label className="flex items-center cursor-pointer gap-2 text-xs font-bold text-gray-600">
              Region Lines
              <input type="checkbox" checked={showBoundaries} onChange={(e) => setShowBoundaries(e.target.checked)} />
            </label>
          </div>

          <input type="text" placeholder="Search by name/postal..." className="w-full sm:w-60 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" disabled={showOnlySelected} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="p-2 border border-gray-300 rounded-lg bg-white outline-none cursor-pointer font-bold shadow-sm" value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            <option value="pins">📍 Pins</option>
            <option value="density">🔴 Density</option>
            <option value="cluster">💠 Cluster</option>
          </select>
        </div>
      </header>

      <div className="flex-1 relative flex flex-col overflow-hidden">
        <MapContainer center={[1.3521, 103.8198]} zoom={12} className="flex-1 w-full z-10">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapBounds markers={filteredHawkers} />
          
          {showBoundaries && Object.entries(regionBoundaries).map(([name, data]) => (
            <Polygon key={name} positions={data.coords} pathOptions={{ color: data.color, fillColor: data.color, fillOpacity: 0.15, weight: 3 }} />
          ))}

          <LayersControl position="topright">
            {Object.entries(groupedHawkers).map(([region, centres]) => (
              <LayersControl.Overlay 
                checked={activeRegions.includes(region)} 
                name={`${region} (${centres.length})`} 
                key={region}
                eventHandlers={{
                  add: () => setActiveRegions(prev => [...prev, region]),
                  remove: () => setActiveRegions(prev => prev.filter(r => r !== region))
                }}
              >
                <FeatureGroup>
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
                          <Popup maxWidth={300}><HawkerCard props={p} address={getAddress(p)} /></Popup>
                        </Marker>
                      );
                    })}
                  </MarkerClusterGroup>
                </FeatureGroup>
              </LayersControl.Overlay>
            ))}
          </LayersControl>
        </MapContainer>

        {selectedIds.length > 0 && (
          <div className="bg-white border-t border-gray-300 p-3 max-h-32 overflow-y-auto z-[3000] shadow-2xl">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 flex justify-between">
              Selected Centres ({selectedIds.length}) 
              <button 
                onClick={() => {setSelectedIds([]); setShowOnlySelected(false);}} 
                className="text-red-600 hover:text-red-800 font-bold border border-red-200 px-2 py-0.5 rounded bg-red-50 text-[9px]"
              >
                CLEAR ALL SELECTIONS
              </button>
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedIds.map(name => (
                <div key={name} className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] flex items-center gap-2 font-bold shadow-sm">
                  {name}<button onClick={() => toggleSelection(name)} className="hover:text-red-200 text-sm leading-none">&times;</button>
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