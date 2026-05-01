import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import MarkerClusterGroup from 'react-leaflet-cluster';

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
  const [selectedRegion, setSelectedRegion] = useState('All');

  useEffect(() => {
    fetch('/hawkers.json')
      .then(res => res.json())
      .then(data => setHawkers(data.features || data));
  }, []);

  const filteredHawkers = hawkers.filter(item => {
    const props = item.properties || {};
    const name = props.NAME || item.name || "";
    const postal = props.ADDRESSPOSTALCODE || item.postal_code || "";
    
    const addressEnv = props.ADDRESS_MYENV;
    const block = props.ADDRESSBLOCKHOUSENUMBER || "";
    const street = props.ADDRESSSTREETNAME || "";
    const finalAddress = addressEnv || (block || street ? `${block} ${street}` : "Address not available");
    
    const term = searchTerm.toLowerCase();

    const matchesSearch = name.toLowerCase().includes(term) || 
      postal.toLowerCase().includes(term) || 
      finalAddress.toLowerCase().includes(term);

    const matchesRegion = selectedRegion === 'All' || 
      finalAddress.toLowerCase().includes(selectedRegion.toLowerCase());

    return matchesSearch && matchesRegion;
  });

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-100">
      <header className="p-4 bg-white shadow-md sticky top-0 z-[2000]" style={{ zIndex: 2000 }}>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Singapore Hawker Centre Explorer</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name, address, or postal code..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="All">All Regions</option>
            <option value="Ang Mo Kio">Ang Mo Kio</option>
            <option value="Bedok">Bedok</option>
            <option value="Bukit Merah">Bukit Merah</option>
            <option value="Clementi">Clementi</option>
            <option value="Jurong">Jurong</option>
            <option value="Tampines">Tampines</option>
            <option value="Toa Payoh">Toa Payoh</option>
          </select>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <MapContainer center={[1.3521, 103.8198]} zoom={12} className="h-full w-full" style={{ height: "100%", width: "100%", zIndex: 10 }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          
          {filteredHawkers.map((hawker, index) => {
            const coords = hawker.geometry?.coordinates || [hawker.latitude, hawker.longitude];
            const position = hawker.geometry ? [coords[1], coords[0]] : [coords[0], coords[1]];
            const props = hawker.properties || {};
            const finalAddress = props.ADDRESS_MYENV || (props.ADDRESSBLOCKHOUSENUMBER || props.ADDRESSSTREETNAME ? `${props.ADDRESSBLOCKHOUSENUMBER || ""} ${props.ADDRESSSTREETNAME || ""}` : "Address not available");

            return (
              <Marker key={index} position={position}>
                {/* Tooltip for hover - Now contains the FULL info card */}
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  {/* Added whitespace-normal to override Leaflet's default no-wrap */}
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

                {/* Popup for click - Keeps the card pinned to the screen when clicked */}
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
        </MapContainer>
      </div>
    </div>
  );
}

export default App;