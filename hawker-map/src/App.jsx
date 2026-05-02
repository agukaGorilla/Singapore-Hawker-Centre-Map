import React, { useState, useEffect } from 'react';
import { 
  MapContainer, TileLayer, Marker, Popup, Tooltip, 
  LayersControl, FeatureGroup 
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons missing in Vite/React-Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const [hawkers, setHawkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch data on mount
  useEffect(() => {
    fetch('/hawkers.json')
      .then(res => res.json())
      .then(data => setHawkers(data.features || data));
  }, []);

  // 2. Helper to construct fallback address
  const getAddress = (props) => {
    const addressEnv = props.ADDRESS_MYENV;
    const block = props.ADDRESSBLOCKHOUSENUMBER || "";
    const street = props.ADDRESSSTREETNAME || "";
    return addressEnv || (block || street ? `${block} ${street}`.trim() : "Address not available");
  };

  // 3. Helper to determine Region by Postal Sector (First 2 digits)
  const getRegion = (postal) => {
    if (!postal) return "Central";
    const sector = parseInt(postal.toString().substring(0, 2), 10);
    if (sector >= 1 && sector <= 27) return "South & Central";
    if (sector >= 31 && sector <= 52) return "East";
    if (sector >= 58 && sector <= 71) return "West";
    if ((sector >= 28 && sector <= 30) || (sector >= 72 && sector <= 78)) return "North";
    if ((sector >= 53 && sector <= 57) || (sector >= 79 && sector <= 82)) return "North-East";
    return "Central";
  };

  // 4. Omni-Search Filter
  const filteredHawkers = hawkers.filter(item => {
    const props = item.properties || {};
    const name = props.NAME || "";
    const postal = props.ADDRESSPOSTALCODE || "";
    const address = getAddress(props);
    const term = searchTerm.toLowerCase();

    return name.toLowerCase().includes(term) || 
           postal.toLowerCase().includes(term) || 
           address.toLowerCase().includes(term);
  });

  // 5. Group filtered results into Regions for the Map Layers
  const groupedHawkers = filteredHawkers.reduce((acc, hawker) => {
    const region = getRegion(hawker.properties?.ADDRESSPOSTALCODE);
    if (!acc[region]) acc[region] = [];
    acc[region].push(hawker);
    return acc;
  }, {});

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-100 overflow-hidden">
      
      {/* Sticky Header */}
      <header className="p-4 bg-white shadow-md sticky top-0 z-[2000] flex flex-col md:flex-row gap-3 items-center" style={{ zIndex: 2000 }}>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">Singapore Hawker Centre Explorer</h1>
          <p className="text-xs text-gray-500">Visualizing {filteredHawkers.length} locations across Singapore</p>
        </div>
        
        <div className="w-full md:w-96">
          <input
            type="text"
            placeholder="Search by name, address, or postal code..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-inner"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Map Content Area */}
      <div className="flex-1 relative">
        <MapContainer 
          center={[1.3521, 103.8198]} 
          zoom={12} 
          className="h-full w-full z-10"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Native Leaflet Layers Control for Region Filtering */}
          <LayersControl position="topright">
            {Object.entries(groupedHawkers).map(([region, centres]) => (
              <LayersControl.Overlay checked name={`📍 ${region} (${centres.length})`} key={region}>
                <FeatureGroup>
                  
                  {/* Clustering Group per Region */}
                  <MarkerClusterGroup chunkedLoading>
                    {centres.map((hawker, index) => {
                      const props = hawker.properties || {};
                      const coords = hawker.geometry?.coordinates || [0, 0];
                      const position = [coords[1], coords[0]]; // GeoJSON to Leaflet format
                      
                      const status = props.STATUS || "Existing";
                      const isNew = status.toLowerCase().includes("construction") || status.toLowerCase().includes("new");

                      return (
                        <Marker 
                          key={`${region}-${index}`} 
                          position={position}
                          opacity={isNew ? 0.6 : 1.0} // Transparency for new/under construction
                        >
                          {/* Hover Tooltip */}
                          <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                            <div className="font-semibold text-gray-800 whitespace-nowrap">
                              {props.NAME} {isNew ? <span className="text-blue-600 text-xs ml-1">(Coming Soon)</span> : ""}
                            </div>
                          </Tooltip>

                          {/* Click Popup */}
                          <Popup maxWidth={300} minWidth={260}>
                            <div className="p-1 w-64 flex flex-col gap-1.5 whitespace-normal overflow-hidden">
                              {props.PHOTOURL && (
                                <img 
                                  src={props.PHOTOURL} 
                                  alt={props.NAME} 
                                  className="w-full h-32 object-cover rounded shadow-sm border border-gray-200" 
                                />
                              )}
                              <h2 className="font-bold text-base border-b border-gray-200 pb-1 leading-tight text-gray-800 break-words">
                                {props.NAME}
                              </h2>
                              <p className="text-xs text-gray-700 leading-relaxed break-words">
                                <strong>Address:</strong> {getAddress(props)}
                              </p>
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-gray-700">
                                  <strong>Postal Code:</strong> {props.ADDRESSPOSTALCODE}
                                </p>
                                <p className="text-xs text-gray-700">
                                  <strong>Stalls:</strong> 
                                  <span className="ml-1 bg-blue-100 text-blue-800 font-bold py-0.5 px-2 rounded-full text-[10px]">
                                    {props.NUMBER_OF_COOKED_FOOD_STALLS || 0}
                                  </span>
                                </p>
                              </div>
                              {/* Status Tag for extra detail */}
                              <div className={`mt-1 inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded w-max ${isNew ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                Status: {status}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MarkerClusterGroup>

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