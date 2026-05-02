import React, { useState, useEffect } from 'react';
import { 
  MapContainer, TileLayer, Marker, Popup, Tooltip, 
  LayersControl, FeatureGroup, useMap 
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Standard Leaflet Pin setup
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Auto-Zoom Component
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

// Dynamic Bubble Icon Generator
const getCustomIcon = (stalls, isNew) => {
  const size = Math.max(24, Math.min(75, 20 + (stalls * 0.25))); 
  const bgClass = isNew ? 'bg-amber-500' : 'bg-blue-600';
  
  const htmlString = `
    <div class="${bgClass} rounded-full border-[3px] border-white shadow-lg flex items-center justify-center opacity-90 transition-transform hover:scale-110" style="width: ${size}px; height: ${size}px;">
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

// Unified Hawker Card
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
  
  // NEW STATE: Toggle between map views
  const [viewMode, setViewMode] = useState('density'); 

  useEffect(() => {
    fetch('/hawkers.json')
      .then(res => res.json())
      .then(data => setHawkers(data.features || data));
  }, []);

  if (hawkers.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl font-bold text-gray-500 animate-pulse">Loading Singapore Hawker Centres...</p>
      </div>
    );
  }

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

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-100 overflow-hidden">
      <header className="p-4 bg-white shadow-md sticky top-0 z-[2000] flex flex-col lg:flex-row gap-4 items-center justify-between" style={{ zIndex: 2000 }}>
        <div className="flex-1 w-full">
          <h1 className="text-xl font-bold text-gray-800">Singapore Hawker Centre Explorer</h1>
          <p className="text-xs text-gray-500">Visualizing {filteredHawkers.length} locations.</p>
        </div>
        
        {/* Updated Header Layout: Search Bar + View Toggle */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search by name, address, or postal code..."
            className="w-full sm:w-80 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="w-full sm:w-48 p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer font-medium text-gray-700"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="density">🔴 Density (Bubbles)</option>
            <option value="pins">📍 Locations (Pins)</option>
          </select>
        </div>
      </header>

      <div className="flex-1 relative">
        <MapContainer center={[1.3521, 103.8198]} zoom={12} className="h-full w-full z-10" style={{ height: "100%", width: "100%" }}>
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

                    {/* Logic to determine which icon to show based on the toggle */}
                    const isDensityView = viewMode === 'density';

                    return (
                      <Marker 
                        key={`${region}-${index}`} 
                        position={position} 
                        icon={isDensityView ? getCustomIcon(stalls, isNew) : DefaultIcon}
                        opacity={!isDensityView && isNew ? 0.6 : 1.0} // Add fade to default pins if new
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
      </div>
    </div>
  );
}

export default App;