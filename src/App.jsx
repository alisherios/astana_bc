import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import AnalyticsPage from './components/AnalyticsPage';
import data from './assets/data.json';

const ZOOM_THRESHOLD = 15;

function MarkersWithZoom({ businessCenters, zoom }) {
  if (zoom < ZOOM_THRESHOLD) return null;

  return (
    <>
      {businessCenters.map(bc => (
        <Marker key={bc.id} position={bc.coords}>
          <Popup>{bc.name}</Popup>
        </Marker>
      ))}
    </>
  );
}

function ZoomAwareMap({ businessCenters }) {
  const [zoom, setZoom] = useState(12);

  function ZoomListener() {
    useMapEvents({
      zoomend: (e) => {
        setZoom(e.target.getZoom());
      },
    });
    return null;
  }

  return (
    <MapContainer center={[43.25, 76.95]} zoom={12} style={{ height: 'calc(100vh - 50px)', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ZoomListener />
      <MarkersWithZoom businessCenters={businessCenters} zoom={zoom} />
    </MapContainer>
  );
}

export default function App() {
  const { businessCenters } = data;
  const [activeTab, setActiveTab] = useState('map');

  return (
    <div className="app-container">
      <nav className="tabs flex space-x-4 p-4 bg-gray-100">
        <button
          className={`tab px-3 py-1 rounded ${activeTab === 'map' ? 'bg-white shadow' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          Map
        </button>
        <button
          className={`tab px-3 py-1 rounded ${activeTab === 'analytics' ? 'bg-white shadow' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </nav>

      <main className="content">
        {activeTab === 'map' ? (
          <ZoomAwareMap businessCenters={businessCenters} />
        ) : (
          <AnalyticsPage />
        )}
      </main>
    </div>
  );
}
