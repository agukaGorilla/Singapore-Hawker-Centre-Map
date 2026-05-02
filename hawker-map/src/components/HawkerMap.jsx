import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, LayersControl, FeatureGroup, useMap, Polygon } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import HawkerCard from './HawkerCard';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
const SelectedPinIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41], className: 'hue-rotate-[140deg] brightness-110 drop-shadow-md' });

const regionBoundaries = {
  "Central": { color: "#3b82f6", coords: [[1.24, 103.75], [1.35, 103.75], [1.35, 103.87], [1.29, 103.87], [1.24, 103.83]] },
  "East": { color: "#10b981", coords: [[1.29, 103.87], [1.34, 103.87], [1.40, 103.93], [1.40, 104.02], [1.29, 104.02]] },
  "North": { color: "#ef4444", coords: [[1.35, 103.75], [1.48, 103.75], [1.48, 103.87], [1.35, 103.87]] },
  "West": { color: "#f59e0b", coords: [[1.18, 103.60], [1.46, 103.60], [1.46, 103.75], [1.18, 103.75]] },
  "North-East": { color: "#8b5cf6", coords: [[1.48, 103.87], [1.40, 103.92], [1.34, 103.87], [1.35, 103.87], [1.48, 103.87]] }
};

const getCustomIcon = (stalls, isNew, isSelected) => {
  const size = Math.max(28, Math.min(85, 24 + (stalls * 0.3))); 
  const bgClass = isNew ? 'bg-amber-500' : 'bg-blue-600';
  const borderClass = isSelected ? 'border-[4px] border-red-500 ring-2 ring-white' : 'border-[3px] border-white';
  const htmlString = `<div class="${bgClass} ${borderClass} rounded-full shadow-lg flex items-center justify-center opacity-90 transition-all hover:scale-110" style="width: ${size}px; height: ${size}px;"><span class="text-white font-black" style="font-size: ${Math.max(12, size / 3)}px;">${stalls > 0 ? stalls : ''}</span></div>`;
  return L.divIcon({ html: htmlString, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
};

function MapBounds({ markers, preventAutoZoom }) {
  const map = useMap();
  useEffect(() => {
    if (preventAutoZoom) return;
    
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.geometry.coordinates[1], m.geometry.coordinates[0]]));
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
    }
  }, [markers, map, preventAutoZoom]);
  return null;
}

const HawkerMap = ({ groupedHawkers, filteredHawkers, viewMode, selectedIds, toggleSelection, showBoundaries, activeRegions, setActiveRegions, showOnlySelected }) => {
  return (
    <MapContainer center={[1.3521, 103.8198]} zoom={12} className="flex-1 w-full z-10">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
      
      {/* Passing showOnlySelected as preventAutoZoom prop */}
      <MapBounds markers={filteredHawkers} preventAutoZoom={showOnlySelected} />
      
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
                      <Tooltip direction="top" opacity={1}><HawkerCard props={p} /></Tooltip>
                      <Popup maxWidth={320}><HawkerCard props={p} /></Popup>
                    </Marker>
                  );
                })}
              </MarkerClusterGroup>
            </FeatureGroup>
          </LayersControl.Overlay>
        ))}
      </LayersControl>
    </MapContainer>
  );
};

export default HawkerMap;