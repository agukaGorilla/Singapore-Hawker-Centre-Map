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
L.Marker.prototype.options.icon = DefaultIcon;

// Automatically fits the map to show all visible markers perfectly
function MapBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => {
        const coords = m.geometry?.coordinates || [0,0];
        return [coords[1], coords[0]];
      }));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [markers, map]);
  return null;
}

// Unified Hawker Card for both Hover and Click
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

  // 1. Fetch data on mount
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
    if (sector >= 1 && sector <= 27) return "South & Central Area";
    if (sector >= 31 && sector <= 52) return "East Area";
    if (sector >= 58 && sector <= 71) return "West Area";
    if ((sector >= 28 && sector <= 30) || (sector >= 72 && sector <= 78)) return "North Area";
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
      <header className="p-4 bg-white shadow-md sticky top-0 z-[2000] flex flex-col md:flex-row gap-3 items-center" style={{ zIndex: 2000 }}>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">Singapore Hawker Centre Explorer</h1>
          <p className="text-xs text-gray-500">Showing {filteredHawkers.length} individual locations</p>
        </div>
        <div className="w-full md:w-96">
          <input
            type="text"
            placeholder="Search by name, address, or postal code..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                  {/* Rendering individual markers directly without clustering */}
                  {centres.map((hawker, index) => {
                    const props = hawker.properties || {};
                    const coords = hawker.geometry?.coordinates || [0, 0];
                    const position = [coords[1], coords[0]]; 
                    const address = getAddress(props);
                    const status = props.STATUS || "Existing";
                    const isNew = status.toLowerCase().includes("construction") || status.toLowerCase().includes("new");

                    return (
                      <Marker key={`${region}-${index}`} position={position} opacity={isNew ? 0.6 : 1.0}>
                        <Tooltip direction="top" offset={[0, -10]} opacity={1}>
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