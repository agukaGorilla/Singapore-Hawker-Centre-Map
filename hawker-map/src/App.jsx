import React, { useState, useEffect } from 'react';
import { 
  MapContainer, TileLayer, Marker, Popup, Tooltip, 
  LayersControl, FeatureGroup, useMap, Polygon 
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const regionBoundaries = {
  "Central": {
    color: "#3b82f6", // Blue
    coords: [[1.34, 103.76], [1.36, 103.83], [1.34, 103.88], [1.29, 103.89], [1.24, 103.83], [1.25, 103.76]]
  },
  "East": {
    color: "#10b981", // Green
    coords: [[1.34, 103.88], [1.40, 103.93], [1.40, 104.01], [1.30, 104.01], [1.29, 103.89]]
  },
  "North": {
    color: "#ef4444", // Red
    coords: [[1.45, 103.73], [1.48, 103.83], [1.36, 103.83], [1.34, 103.76]]
  },
  "West": {
    color: "#f59e0b", // Orange
    coords: [[1.46, 103.62], [1.45, 103.73], [1.34, 103.76], [1.25, 103.76], [1.18, 103.62]]
  },
  "North-East": {
    color: "#8b5cf6", // Purple
    coords: [[1.48, 103.83], [1.40, 103.93], [1.34, 103.88], [1.36, 103.83]]
  }
};

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const SelectedPinIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'hue-rotate-[140deg] brightness-110 drop-shadow-md'
});

function MapBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => {
        const coords = m.geometry?.coordinates || [0,0];
        return [coords[1], coords[0]];
      }));
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
    }
  }, [markers, map]);
  return null;
}

const getCustomIcon = (stalls, isNew, isSelected) => {
  const size = Math.max(24, Math.min(75, 20 + (stalls * 0.25))); 
  const bgClass = isNew ? 'bg-amber-500' : 'bg-blue-600';
  const borderClass = isSelected ? 'border-[4px] border-red-500 ring-2 ring-white' : 'border-[3px] border-white';
  
  const htmlString = `
    <div class="${bgClass} ${borderClass} rounded-full shadow-lg flex items-center justify-center opacity-90 transition-all hover:scale-110" style="width: ${size}px; height: ${size}px;">
      <span class="text-white font-bold" style="font-size: ${Math.max(9, size / 3.5)}px;">
        ${stalls > 0 ? stalls : ''}
      </span>
    </div>
  `;

  return L.divIcon({ html: htmlString, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
};

const HawkerCard = ({ props, address, status, isNew }) => (
  <div className="p-1 w-64 flex flex-col gap-1.5 whitespace-normal overflow-hidden leading-snug">
    {props.PHOTOURL && (
      <img src={props.PHOTOURL} alt={props.NAME} className="w-full h-32 object-cover rounded shadow-sm border border-gray-200" />
    )}
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
  const [viewMode, setViewMode] = useState('density'); 
  const [selectedIds, setSelectedIds] = useState([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  useEffect(() => {
    fetch('/hawkers.json').then(res => res.json()).then(data => setHawkers(data.features || data));
  }, []);

  if (hawkers.length === 0) return null;

  const getAddress = (p) => p.ADDRESS_MYENV || (p.ADDRESSBLOCKHOUSENUMBER || p.ADDRESSSTREETNAME ? `${p.ADDRESSBLOCKHOUSENUMBER || ""} ${p.ADDRESSSTREETNAME || ""}`.trim() : "N/A");

  const getRegion = (postal) => {
    if (!postal) return "Central Area";
    const sector = parseInt(postal.toString().substring(0, 2), 10);
    if (sector >= 1 && sector <= 33) return "South & Central Area";
    if (sector >= 34 && sector <= 52) return "East Area";
    if (sector >= 58 && sector <= 71) return "West Area";
    if (sector >= 72 && sector <= 78) return "North Area";
    return "North-East Area";
  };

  const filteredHawkers = hawkers.filter(item => {
    const props = item.properties || {};
    if (showOnlySelected) return selectedIds.includes(props.NAME);
    const address = getAddress(props);
    const term = searchTerm.toLowerCase();
    return (props.NAME || "").toLowerCase().includes(term) || 
           (props.ADDRESSPOSTALCODE || "").toLowerCase().includes(term) || 
           address.toLowerCase().includes(term);
  });

  const groupedHawkers = filteredHawkers.reduce((acc, hawker) => {
    const region = getRegion(hawker.properties?.ADDRESSPOSTALCODE);
    if (!acc[region]) acc[region] = [];
    acc[region].push(hawker);
    return acc;
  }, {});

  const toggleSelection = (name) => {
    setSelectedIds(prev => prev.includes(name) ? prev.filter(id => id !== name) : [...prev, name]);
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-100 overflow-hidden text-sm">
      <header className="p-4 bg-white shadow-md sticky top-0 z-[2000] flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">Singapore Hawker Explorer</h1>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Mode: {viewMode}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <label className="flex items-center cursor-pointer gap-2 bg-gray-100 px-3 py-2 rounded-lg text-xs font-bold border border-gray-200">
            Only Selected
            <input type="checkbox" checked={showOnlySelected} onChange={(e) => setShowOnlySelected(e.target.checked)} />
          </label>

          <input
            type="text"
            placeholder="Search Maxwell, 069184..."
            className="w-full sm:w-60 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            disabled={showOnlySelected}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select 
            className="p-2 border border-gray-300 rounded-lg bg-white outline-none cursor-pointer font-bold"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="density">🔴 Density</option>
            <option value="pins">📍 Pins</option>
            <option value="regions">🗺️ Regions</option>
          </select>
        </div>
      </header>

      <div className="flex-1 relative flex flex-col overflow-hidden">
        <MapContainer center={[1.3521, 103.8198]} zoom={12} className="flex-1 w-full z-10">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapBounds markers={filteredHawkers} />

          {/* Render Physical Regional Lines when in Regions mode */}
          {viewMode === 'regions' && Object.entries(regionBoundaries).map(([name, data]) => (
            <Polygon 
              key={name}
              positions={data.coords} 
              pathOptions={{ color: data.color, fillColor: data.color, fillOpacity: 0.15, weight: 3 }}
            >
              <Tooltip sticky>{name} Region</Tooltip>
            </Polygon>
          ))}

          <LayersControl position="topright">
            {Object.entries(groupedHawkers).map(([region, centres]) => (
              <LayersControl.Overlay checked name={`${region} (${centres.length})`} key={region}>
                <FeatureGroup>
                  {centres.map((hawker, index) => {
                    const props = hawker.properties || {};
                    const coords = hawker.geometry?.coordinates || [0, 0];
                    const position = [coords[1], coords[0]]; 
                    const stalls = props.NUMBER_OF_COOKED_FOOD_STALLS || 0;
                    const isNew = (props.STATUS || "").toLowerCase().includes("new") || (props.STATUS || "").toLowerCase().includes("construction");
                    const isSelected = selectedIds.includes(props.NAME);

                    return (
                      <Marker 
                        key={`${region}-${index}`} 
                        position={position} 
                        icon={viewMode === 'density' ? getCustomIcon(stalls, isNew, isSelected) : (isSelected ? SelectedPinIcon : DefaultIcon)}
                        opacity={viewMode === 'pins' && isNew ? 0.6 : 1.0}
                        eventHandlers={{ click: () => toggleSelection(props.NAME) }}
                      >
                        <Tooltip direction="top" opacity={1}>
                          <HawkerCard props={props} address={getAddress(props)} status={props.STATUS} isNew={isNew} />
                        </Tooltip>
                        <Popup maxWidth={300} minWidth={260}>
                          <HawkerCard props={props} address={getAddress(props)} status={props.STATUS} isNew={isNew} />
                        </Popup>
                      </Marker>
                    );
                  })}
                </FeatureGroup>
              </LayersControl.Overlay>
            ))}
          </LayersControl>
        </MapContainer>

        {selectedIds.length > 0 && (
          <div className="bg-white border-t border-gray-300 p-3 max-h-32 overflow-y-auto z-[3000] shadow-inner">
            <div className="flex flex-wrap gap-2">
              {selectedIds.map(name => (
                <div key={name} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-[10px] flex items-center gap-2 border border-blue-200 font-bold">
                  {name}
                  <button onClick={() => toggleSelection(name)} className="hover:text-red-600">×</button>
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