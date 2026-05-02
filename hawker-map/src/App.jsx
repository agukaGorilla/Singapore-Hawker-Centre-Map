import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, LayersControl, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icons
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

  useEffect(() => {
    fetch('/hawkers.json')
      .then(res => res.json())
      .then(data => setHawkers(data.features || data));
  }, []);

  // Groups hawker centres into Singapore's native regions based on postal sectors
  const getRegion = (postal) => {
    if (!postal) return "Central Area";
    const sector = parseInt(postal.toString().substring(0, 2), 10);
    if (sector >= 1 && sector <= 27) return "South & Central Area";
    if (sector >= 31 && sector <= 52) return "East Area";
    if (sector >= 58 && sector <= 71) return "West Area";
    if ((sector >= 28 && sector <= 30) || (sector >= 72 && sector <= 78)) return "North Area";
    if ((sector >= 53 && sector <= 57) || (sector >= 79 && sector <= 82)) return "North-East Area";
    return "Central Area";
  };

  const filteredHawkers = hawkers.filter(item => {
    const props = item.properties || {};
    const name = props.NAME || item.name || "";
    const postal = props.ADDRESSPOSTALCODE || item.postal_code || "";
    
    const addressEnv = props.ADDRESS_MYENV;
    const block = props.ADDRESSBLOCKHOUSENUMBER || "";
    const street = props.ADDRESSSTREETNAME || "";
    const finalAddress = addressEnv || (block || street ? `${block} ${street}` : "Address not available");
    
    const term = searchTerm.toLowerCase();

    return name.toLowerCase().includes(term) || 
           postal.toLowerCase().includes(term) || 
           finalAddress.toLowerCase().includes(term);
  });

  // Organize the filtered results into their respective regions
  const groupedHawkers = filteredHawkers.reduce((acc, hawker) => {
    const region = getRegion(hawker.properties?.ADDRESSPOSTALCODE);
    if (!acc[region]) acc[region] = [];
    acc[region].push(hawker);
    return acc;
  }, {});

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-100">
      
      {/* Fixed Layout: Search bar is now full width and highly visible */}
      <header className="p-4 bg-white shadow-md sticky top-0 z-[2000]" style={{ zIndex: 2000 }}>
        <div className="flex flex-col gap-3 max-w-5xl">
          <h1 className="text-2xl font-bold text-gray-800">Singapore Hawker Centre Explorer</h1>
          <input
            type="text"
            placeholder="Search by name, address, or postal code (e.g., Maxwell, 069184)..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <MapContainer center={[1.3521, 103.8198]} zoom={12} className="h-full w-full" style={{ height: "100%", width: "100%", zIndex: 10 }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          
          {/* Native Leaflet Area Grouping - Replaces the buggy cluster library */}
          <LayersControl position="topright">
            {Object.entries(groupedHawkers).map(([region, centres]) => (
              <LayersControl.Overlay checked name={`${region} (${centres.length})`} key={region}>
                <LayerGroup>
                  {centres.map((hawker, index) => {
                    const coords = hawker.geometry?.coordinates || [hawker.latitude, hawker.longitude];
                    const position = hawker.geometry ? [coords[1], coords[0]] : [coords[0], coords[1]];
                    const props = hawker.properties || {};
                    const finalAddress = props.ADDRESS_MYENV || (props.ADDRESSBLOCKHOUSENUMBER || props.ADDRESSSTREETNAME ? `${props.ADDRESSBLOCKHOUSENUMBER || ""} ${props.ADDRESSSTREETNAME || ""}` : "Address not available");

                    return (
                      <Marker key={index} position={position}>
                        <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                          <div className="p-2 w-64 flex flex-col gap-1 overflow-hidden whitespace-normal">
                            {props.PHOTOURL && (
                              <img src={props.PHOTOURL} alt={props.NAME || "Hawker Centre"} className="w-full h-32 object-cover rounded mb-1 shadow-sm" />
                            )}
                            <h2 className="font-bold text-base border-b pb-1 mb-1 leading-tight text-gray-800 break-words">
                              {props.NAME || hawker.name}
                            </h2>
                            <p className="text-xs text-gray-700 leading-snug break-words"><strong>Address:</strong> {finalAddress}</p>
                            <p className="text-xs text-gray-700"><strong>Postal Code:</strong> {props.ADDRESSPOSTALCODE || hawker.postal_code}</p>
                            <p className="text-xs text-gray-700"><strong>Food Stalls:</strong> <span className="bg-blue-100 text-blue-800 py-0.5 px-1.5 rounded">{props.NUMBER_OF_COOKED_FOOD_STALLS || 0}</span></p>
                          </div>
                        </Tooltip>

                        <Popup maxWidth={280} minWidth={250}>
                          <div className="p-2 w-64 flex flex-col gap-1 overflow-hidden whitespace-normal">
                            {props.PHOTOURL && (
                              <img src={props.PHOTOURL} alt={props.NAME || "Hawker Centre"} className="w-full h-32 object-cover rounded mb-1 shadow-sm" />
                            )}
                            <h2 className="font-bold text-base border-b pb-1 mb-1 leading-tight text-gray-800 break-words">
                              {props.NAME || hawker.name}
                            </h2>
                            <p className="text-xs text-gray-700 leading-snug break-words"><strong>Address:</strong> {finalAddress}</p>
                            <p className="text-xs text-gray-700"><strong>Postal Code:</strong> {props.ADDRESSPOSTALCODE || hawker.postal_code}</p>
                            <p className="text-xs text-gray-700"><strong>Food Stalls:</strong> <span className="bg-blue-100 text-blue-800 py-0.5 px-1.5 rounded">{props.NUMBER_OF_COOKED_FOOD_STALLS || 0}</span></p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </LayerGroup>
              </LayersControl.Overlay>
            ))}
          </LayersControl>

        </MapContainer>
      </div>
    </div>
  );
}

export default App;