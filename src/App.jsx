import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.heat';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Map, BarChart3, Square, Layers, TrendingUp, Building, Users, Languages, Info, Check, Wifi, Zap } from 'lucide-react';
import AnalyticsPage from './components/AnalyticsPage';
import { useTranslation } from './translations';
import './App.css';
import data from './assets/data.json';
import providersData from './assets/providers_data.json';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const ktClientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const lowPenetrationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const highSpeedProviderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32], iconAnchor: [10, 32], popupAnchor: [1, -28], shadowSize: [32, 32]
});
const mediumSpeedProviderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32], iconAnchor: [10, 32], popupAnchor: [1, -28], shadowSize: [32, 32]
});
const lowSpeedProviderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32], iconAnchor: [10, 32], popupAnchor: [1, -28], shadowSize: [32, 32]
});

function getPenetrationRate(bc) {
  const total = bc.companies.length;
  const kt = bc.companies.filter(c => c.is_kt_client).length;
  return total === 0 ? 0 : (kt / total) * 100;
}
function getIconForBusinessCenter(bc) {
  const pen = getPenetrationRate(bc);
  return pen > 0 && pen < 30 ? lowPenetrationIcon : defaultIcon;
}
function getIconForProvider(provider) {
  const d = provider.val_download_mbps;
  return d >= 100 ? highSpeedProviderIcon : d >= 50 ? mediumSpeedProviderIcon : lowSpeedProviderIcon;
}

// Nav, Controls, Legend, Stats omitted for brevity...
// Component for handling map interactions
function MapInteractions({
  businessCenters, providers, showHeatmap, showClusters,
  zoneSelectionMode, setZoneSelectionMode, selectedZone, setSelectedZone,
  filterType, onOrganizationClick, onBusinessCenterClick,
  onProviderClick, language, polygonPoints, setPolygonPoints,
  finishPolygon, showProviders
}) {
  const map = useMap();
  const markersRef = useRef();
  const heatmapRef = useRef();
  const providerRef = useRef();

  useEffect(() => {
    if (!map) return;
    [markersRef.current, heatmapRef.current, providerRef.current].forEach(layer => layer && map.removeLayer(layer));
    // Providers layer
    if (showProviders) {
      const cl = L.markerClusterGroup();
      providers.forEach(p => {
        const m = L.marker([p.attr_location_latitude, p.attr_location_longitude], { icon: getIconForProvider(p) });
        m.bindPopup(renderProviderPopup(p, onProviderClick, language));
        cl.addLayer(m);
      });
      providerRef.current = cl;
      map.addLayer(cl);
    }
    // Filter BCs
    let bcs = businessCenters;
    if (filterType === 'kt') bcs = bcs.filter(bc => bc.companies.some(c => c.is_kt_client));
    if (filterType === 'non-kt') bcs = bcs.filter(bc => !bc.companies.some(c => c.is_kt_client));
    // Heatmap data
    const hData = bcs.map(bc => [bc.latitude, bc.longitude, Math.max(bc.companies.filter(c => c.is_kt_client).length * 0.1,
      bc.companies.reduce((s,c) => s + (c.accruals||0),0)/1e6)]);
    if (showHeatmap) heatmapRef.current = L.heatLayer(hData).addTo(map);
    // BC markers
    if (showClusters) {
      const cl = L.markerClusterGroup();
      bcs.forEach(bc => {
        const m = L.marker([bc.latitude, bc.longitude], { icon: getIconForBusinessCenter(bc) });
        m.bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language));
        cl.addLayer(m);
      });
      markersRef.current = cl;
      map.addLayer(cl);
    } else {
      bcs.forEach(bc => {
        const m = L.marker([bc.latitude, bc.longitude], { icon: getIconForBusinessCenter(bc) });
        m.bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language));
        m.addTo(map);
      });
    }
    return () => {
      [markersRef.current, heatmapRef.current, providerRef.current].forEach(layer => layer && map.removeLayer(layer));
    };
  }, [map, businessCenters, providers, showHeatmap, showClusters, filterType, showProviders, language]);

  // Polygon & click handling omitted for brevity...
  return selectedZone?.type === 'polygon' ? <Polygon positions={selectedZone.points} /> : null;
}

// ... renderCompanyPopup, renderProviderPopup, modal components, etc. remain unchanged ...

function App() {
  const [businessCenters, setBusinessCenters] = useState([]);
  const [providers, setProviders] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [zoneSelectionMode, setZoneSelectionMode] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedBusinessCenter, setSelectedBusinessCenter] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [language, setLanguage] = useState('ru');
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [showProviders, setShowProviders] = useState(false);

  useEffect(() => {
    setBusinessCenters(data);
    setProviders(providersData);
  }, []);

  useEffect(() => {
    window.handleOrganizationClick = bin => {
      const org = businessCenters.flatMap(bc => bc.companies).find(c => c.bin === bin);
      org && setSelectedOrganization(org);
    };
    window.handleBusinessCenterClick = id => {
      const bc = businessCenters.find(b => b.id === id);
      bc && setSelectedBusinessCenter(bc);
    };
    window.handleProviderClick = name => {
      const p = providers.find(p => p.attr_provider_name === name);
      p && setSelectedProvider(p);
    };
    return () => {
      delete window.handleOrganizationClick;
      delete window.handleBusinessCenterClick;
      delete window.handleProviderClick;
    };
  }, [businessCenters, providers]);

  const clearZone = () => { setSelectedZone(null); setZoneSelectionMode(false); setPolygonPoints([]); };
  const finishPolygon = () => {
    if (polygonPoints.length > 2) setSelectedZone({ type: 'polygon', points: polygonPoints });
    else alert('Добавьте минимум 3 точки.');
    setZoneSelectionMode(false);
  };

  return (
    <Router>
      <div className="App">
        <Navigation language={language} setLanguage={setLanguage} />
        <Routes>
          <Route path="/" element={
            <div className="map-container">
              <MapControls
                showHeatmap={showHeatmap} setShowHeatmap={setShowHeatmap}
                showClusters={showClusters} setShowClusters={setShowClusters}
                zoneSelectionMode={zoneSelectionMode} setZoneSelectionMode={setZoneSelectionMode}
                selectedZone={selectedZone} clearZone={clearZone}
                filterType={filterType} setFilterType={setFilterType}
                language={language}
                polygonPoints={polygonPoints} finishPolygon={finishPolygon}
                showProviders={showProviders} setShowProviders={setShowProviders}
              />
              <MapLegend language={language} showProviders={showProviders} />
              <ZoneStatsPanel selectedZone={selectedZone} businessCenters={businessCenters} language={language} />

              <MapContainer center={[51.1694, 71.4491]} zoom={12} style={{ height: 'calc(100vh - 120px)', width: '100%' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapInteractions
                  businessCenters={businessCenters}
                  providers={providers}
                  showHeatmap={showHeatmap}
                  showClusters={showClusters}
                  zoneSelectionMode={zoneSelectionMode}
                  setZoneSelectionMode={setZoneSelectionMode}
                  selectedZone={selectedZone}
                  setSelectedZone={setSelectedZone}
                  filterType={filterType}
                  onOrganizationClick={c => setSelectedOrganization(c)}
                  onBusinessCenterClick={bc => setSelectedBusinessCenter(bc)}
                  onProviderClick={p => setSelectedProvider(p)}
                  language={language}
                  polygonPoints={polygonPoints}
                  setPolygonPoints={setPolygonPoints}
                  finishPolygon={finishPolygon}
                  showProviders={showProviders}
                />
              </MapContainer>

              <OrganizationCard organization={selectedOrganization} isOpen={!!selectedOrganization} onClose={() => setSelectedOrganization(null)} language={language} />
              <BusinessCenterCard businessCenter={selectedBusinessCenter} isOpen={!!selectedBusinessCenter} onClose={() => setSelectedBusinessCenter(null)} onOrganizationClick={c => setSelectedOrganization(c)} language={language} />
              <ProviderCard provider={selectedProvider} isOpen={!!selectedProvider} onClose={() => setSelectedProvider(null)} language={language} />
            </div>
          } />
          <Route path="/analytics" element={<AnalyticsPage businessCenters={businessCenters} language={language} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
