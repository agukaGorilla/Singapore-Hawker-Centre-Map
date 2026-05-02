import React, { useState, useEffect } from 'react';
import { 
  MapContainer, TileLayer, Marker, Popup, Tooltip, 
  LayersControl, FeatureGroup, useMap 
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

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

L.Marker.prototype.options.icon = DefaultIcon;

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

  return L.divIcon({
    html: htmlString,
    className: '', 
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2] 
  });
};

const HawkerCard = ({ props, address, status, isNew }) => (
  <div className="p-1 w-64 flex flex-col gap-1.5 whitespace-normal overflow-hidden">
    {props.PHOTOURL && (
      <img src={props.PHOTOURL} alt={props.NAME} className="w-full h-32 object-cover rounded shadow-sm border border-gray-200" />
    )}
    <h2 className="font-bold text-base border-b border-gray-200 pb-1 mb-1 leading-tight text-gray-800 break-words">
      {props.NAME}
    </h2>
    <p className="text-xs text-gray-700 leading-relaxed break-words">
      <strong>Address:</strong> {address}
    </p>
    <div className="flex justify-between items-center mt-1">
      <p className="text-xs text-gray-700"><strong>Postal Code:</strong> {props.ADDRESSPOSTALCODE}</p>
      <p className="text-xs text-gray-700">
        <strong>Stalls:</strong> 
        <span className="ml-1 bg-blue-100 text-blue-800 font-bold py-0.5 px-2 rounded-full text-[10px]">
          {props.NUMBER_OF_COOKED_FOOD_STALLS || 0}
        </span>
      </p>
    </div>
    <div className={`mt-1 inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded w-max ${isNew ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
      Status: {status}
    </div>
  </div>
);

function App() {
  const [hawkers, setHawkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('density'); 
  const [selectedIds, setSelectedIds] = useState([]);
  
  // NEW: State for "Only Selected" toggle
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  useEffect(() => {
    fetch('/hawkers.json')
      .then(res => res.json())
      .then(data => setHawkers(data.features || data));
  }, []);

  if (hawkers.length === 0) return null;

  const getAddress = (props) => {
    const addressEnv = props.ADDRESS_MYENV;
    const block = props.ADDRESSBLOCKHOUSENUMBER || "";
    const street = props.ADDRESSSTREETNAME || "";
    return addressEnv || (block || street ? `${block} ${street}`.trim() : "Address not available");
  };

  const getRegion = (postal) => {
    if (!postal) return "Central Area";
    const sector = parseInt(postal.toString().substring(0, 2), 10);
    if (sector >= 1 && sector <= 33) return "South & Central Area";
    if (sector >= 34 && sector <= 52) return "East Area";
    if (sector >= 58 && sector <= 71) return "West Area";
    if (sector >= 72 && sector <= 78) return "North Area";
    if ((sector >= 53 && sector <= 57) || (sector >= 79 && sector <= 82)) return "North-East Area";
    return "Central Area";
  };

  const filteredHawkers = hawkers.filter(item => {
    const props = item.properties || {};
    
    // NEW: Apply the "Only Selected" filter first if active
    if (showOnlySelected) {
      return selectedIds.includes(props.NAME);
    }

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
    setSelectedIds(prev => 
      prev.includes(name) ? prev.filter(id => id !== name) : [...prev, name]
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-100 overflow-hidden">
      <header className="p-4 bg-white shadow-md sticky top-0 z-[2000] flex flex-col lg:flex-row gap-4 items-center justify-between" style={{ zIndex: 2000 }}>
        <div className="flex-1 w-full">
          <h1 className="text-xl font-bold text-gray-800">Singapore Hawker Centre Explorer</h1>
          <p className="text-xs text-gray-500">Visualizing {filteredHawkers.length} locations.</p>
        </div>
        
        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 items-center">
          {/* NEW: Toggle Switch UI */}
          <label className="flex items-center cursor-pointer gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-xs font-bold text-gray-600">Only Selected</span>
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              checked={showOnlySelected}
              onChange={(e) => setShowOnlySelected(e.target.checked)}
            />
          </label>

          <input
            type="text"
            placeholder="Search by name, address, or postal code..."
            className="w-full sm:w-64 p-2 border border-gray-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500"
            disabled={showOnlySelected} // Disable search when "Only Selected" is on
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select 
            className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="density">🔴 Density</option>
            <option value="pins">📍 Pins</option>
          </select>
        </div>
      </header>

      <div className="flex-1 relative flex flex-col overflow-hidden">
        <MapContainer center={[1.3521, 103.8198]} zoom={12} className="flex-1 w-full z-10">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          <MapBounds markers={filteredHawkers} />

          <LayersControl position="topright">
            {Object.entries(groupedHawkers).map(([region, centres]) => (
              <LayersControl.Overlay checked name={`📍 ${region} (${centres.length})`} key={region}>
                <FeatureGroup>
                  {centres.map((hawker, index) => {
                    const props = hawker.properties || {};
                    const coords = hawker.geometry?.coordinates || [0, 0];
                    const position = [coords[1], coords[0]]; 
                    const address = getAddress(props);
                    const stalls = props.NUMBER_OF_COOKED_FOOD_STALLS || 0;
                    const status = props.STATUS || "Existing";
                    const isNew = status.toLowerCase().includes("construction") || status.toLowerCase().includes("new");
                    const isDensityView = viewMode === 'density';
                    const isSelected = selectedIds.includes(props.NAME);

                    return (
                      <Marker 
                        key={`${region}-${index}`} 
                        position={position} 
                        icon={isDensityView ? getCustomIcon(stalls, isNew, isSelected) : (isSelected ? SelectedPinIcon : DefaultIcon)}
                        opacity={!isDensityView && isNew ? 0.6 : 1.0}
                        eventHandlers={{ click: () => toggleSelection(props.NAME) }}
                      >
                        <Tooltip direction="top" opacity={1}>
                          <HawkerCard props={props} address={address} status={status} isNew={isNew} />
                        </Tooltip>
                        <Popup maxWidth={300} minWidth={260}>
                          <HawkerCard props={props} address={address} status={status} isNew={isNew} />
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
          <div className="bg-white border-t border-gray-300 p-4 max-h-40 overflow-y-auto z-[3000] shadow-2xl">
            <h3 className="text-sm font-bold mb-2 text-gray-700 flex justify-between items-center">
              Selected Centres ({selectedIds.length})
              <button onClick={() => {setSelectedIds([]); setShowOnlySelected(false);}} className="text-[10px] text-red-500 hover:underline">Clear All</button>
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedIds.map(name => (
                <div key={name} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs flex items-center gap-2 border border-blue-200">
                  {name}
                  <button onClick={() => toggleSelection(name)} className="font-bold hover:text-red-600 px-1">×</button>
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