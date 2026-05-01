import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons not showing up in React-Leaflet
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

  // 1. Fetch the data from your public folder
  useEffect(() => {
    fetch('/hawkers.json')
      .then(res => res.json())
      .then(data => {
        // Handle both GeoJSON and standard JSON structures
        const records = data.features || data; 
        setHawkers(records);
      });
  }, []);

  // 2. Filter logic for the Search Bar [cite: 141]
  const filteredHawkers = hawkers.filter(item => {
    const name = item.properties?.NAME || item.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-100">
      {/* Search Header [cite: 139, 141] */}
      <header className="p-4 bg-white shadow-md z-[1000]">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Singapore Hawker Centre Explorer</h1>
        <input
          type="text"
          placeholder="Search by name (e.g. Maxwell, Amoy)..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      {/* The Map Component [cite: 126, 138] */}
      <div className="flex-1 relative">
        <MapContainer 
          center={[1.3521, 103.8198]}
          zoom={12} 
          className="h-full w-full"
          style={{height: "80vh", width: "100%"}}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Render markers for each filtered hawker centre [cite: 127, 128] */} 
          {filteredHawkers.map((hawker, index) => {
            const coords = hawker.geometry?.coordinates || [hawker.latitude, hawker.longitude];
            // Leaflet expects [lat, lng], GeoJSON often uses [lng, lat]
            const position = hawker.geometry ? [coords[1], coords[0]] : [coords[0], coords[1]];

            return (
              <Marker key={index} position={position}>
                <Popup>
                  <div className="p-1">
                    <h2 className="font-bold text-lg border-b mb-1">{hawker.properties?.NAME || hawker.name}</h2>
                      <p className="text-sm text-gray-600"><strong>Address:</strong> {hawker.properties?.ADDRESS_MYENV}</p>
                      <p className="text-sm text-gray-600"><strong>Postal Code:</strong> {hawker.properties?.ADDRESSPOSTALCODE}</p>
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