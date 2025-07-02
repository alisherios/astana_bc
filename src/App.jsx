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

// Navigation component
function Navigation({ language, setLanguage }) {
  const location = useLocation();
  const { t } = useTranslation(language);
  return (
    <div className="bg-white shadow-sm border-b p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/kazakhtelecom_logo.png" alt="Казахтелеком" className="h-12 w-auto" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('mapTitle')}</h1>
            <p className="text-gray-600 mt-1">{t('mapDescription')}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Link to="/">
            <Button variant={location.pathname === '/' ? 'default' : 'outline'} className="flex items-center gap-2">
              <Map className="w-4 h-4" />{t('mapButton')}
            </Button>
          </Link>
          <Link to="/analytics">
            <Button variant={location.pathname === '/analytics' ? 'default' : 'outline'} className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />{t('analyticsButton')}
            </Button>
          </Link>
          <Button onClick={() => setLanguage(language === 'ru' ? 'kk' : 'ru')} variant="outline" className="flex items-center gap-2">
            <Languages className="w-4 h-4" />{language === 'ru' ? 'ҚАЗ' : 'РУС'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Map legend component
function MapLegend({ language, showProviders }) {
  const { t } = useTranslation(language);
  return (
    <Card className="map-legend absolute bottom-4 left-4 z-[1000]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2"><Info className="w-4 h-4" />{t('legend')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!showProviders ? (
          <>            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
              <span className="text-xs text-gray-600">{t('regularMarkers')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-xs text-gray-600">{t('lowPenetrationMarkers')}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">{t('highSpeedProviders')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-xs text-gray-600">{t('mediumSpeedProviders')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">{t('lowSpeedProviders')}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Map controls component
function MapControls({ showHeatmap, setShowHeatmap, showClusters, setShowClusters, zoneSelectionMode, setZoneSelectionMode, selectedZone, clearZone, filterType, setFilterType, language, polygonPoints, finishPolygon, showProviders, setShowProviders }) {
  const { t } = useTranslation(language);
  return (
    <div className="map-controls p-4 space-y-2 bg-white rounded shadow-sm absolute top-4 left-4 z-[1000]">
      <div className="flex gap-2">
        <Button onClick={() => setFilterType('all')} variant={filterType === 'all' ? 'default' : 'outline'} className="flex items-center gap-2">
          <Users className="w-4 h-4" />{t('allFilter')}
        </Button>
        <Button onClick={() => setFilterType('kt')} variant={filterType === 'kt' ? 'default' : 'outline'} className="flex items-center gap-2">
          <Building className="w-4 h-4" />{t('ktFilter')}
        </Button>
        <Button onClick={() => setFilterType('non-kt')} variant={filterType === 'non-kt' ? 'default' : 'outline'} className="flex items-center gap-2">
          <Building className="w-4 h-4" />{t('nonKtFilter')}
        </Button>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setShowProviders(!showProviders)} variant={showProviders ? 'default' : 'outline'} className="flex items-center gap-2">
          <Wifi className="w-4 h-4" />{showProviders ? t('hideProviders') : t('showProviders')}
        </Button>
        <Button onClick={() => setShowHeatmap(!showHeatmap)} variant={showHeatmap ? 'default' : 'outline'} className="flex items-center gap-2">
          <Layers className="w-4 h-4" />{showHeatmap ? t('hideHeatmap') : t('showHeatmap')}
        </Button>
        <Button onClick={() => setShowClusters(!showClusters)} variant={showClusters ? 'default' : 'outline'} className="flex items-center gap-2">
          <Zap className="w-4 h-4" />{showClusters ? t('separateMarkers') : t('clustering')}
        </Button>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setZoneSelectionMode(!zoneSelectionMode)} variant={zoneSelectionMode ? 'default' : 'outline'} className="flex items-center gap-2">
          <Square className="w-4 h-4" />{zoneSelectionMode ? t('cancelSelection') : t('selectZone')}
        </Button>
        {zoneSelectionMode && polygonPoints.length > 2 && (
          <Button onClick={finishPolygon} variant="default" className="flex items-center gap-2">
            <Check className="w-4 h-4" />{t('finishSelection')}
          </Button>
        )}
        {selectedZone && (
          <Button onClick={clearZone} variant="destructive" className="flex items-center gap-2">{t('clearZone')}</Button>
        )}
      </div>
    </div>
  );
}

// Zone statistics panel
function ZoneStatsPanel({ selectedZone, businessCenters, language }) {
  const { t } = useTranslation(language);
  if (!selectedZone) return null;
  const isPointInPolygon = (point, vs) => {
    let x = point[0], y = point[1], inside = false;
    for (let i=0,j=vs.length-1; i<vs.length; j=i++) {
      let xi=vs[i][0], yi=vs[i][1], xj=vs[j][0], yj=vs[j][1];
      let intersect = ((yi>y)!=(yj>y)) && (x<(xj-xi)*(y-yi)/(yj-yi)+xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };
  const filtered = businessCenters.filter(bc => selectedZone.type==='polygon'? isPointInPolygon([bc.latitude,bc.longitude], selectedZone.points):false);
  const totalBC = filtered.length;
  const totalCompanies = filtered.reduce((sum,bc)=>sum+bc.companies.length,0);
  const ktClients = filtered.reduce((sum,bc)=>sum+bc.companies.filter(c=>c.is_kt_client).length,0);
  const totalRevenue = filtered.reduce((sum,bc)=>sum+bc.companies.reduce((s,c)=>s+(c.accruals||0),0),0);
  return (
    <Card className="zone-stats-panel absolute top-4 right-4 z-[1000]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5" />{t('zoneStats')}</CardTitle>
        <CardDescription>{t('zoneStatsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between"><span className="text-sm text-gray-600">{t('businessCenters')}</span><Badge variant="secondary">{totalBC}</Badge></div>
        <div className="flex justify-between"><span className="text-sm text-gray-600">{t('companies')}</span><Badge variant="secondary">{totalCompanies}</Badge></div>
        <div className="flex justify-between"><span className="text-sm text-gray-600">{t('ktClients')}</span><Badge variant="default" className="bg-blue-600">{ktClients}</Badge></div>
        <div className="flex justify-between"><span className="text-sm text-gray-600">{t('totalRevenue')}</span><Badge variant="outline">{totalRevenue.toLocaleString()} {t('currency')}</Badge></div>
      </CardContent>
    </Card>
  );
}

// Helper popups and modal components remain unchanged

// MapInteractions component (independent layers)
function MapInteractions({ businessCenters, providers, showHeatmap, showClusters, zoneSelectionMode, setZoneSelectionMode, selectedZone, setSelectedZone, filterType, onOrganizationClick, onBusinessCenterClick, onProviderClick, language, polygonPoints, setPolygonPoints, finishPolygon, showProviders }) {
  const map = useMap();
  const markersRef = useRef();
  const heatmapRef = useRef();
  const providerRef = useRef();

  useEffect(() => {
    if (!map) return;
    // Remove previous layers
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

    // Filter business centers
    let bcs = businessCenters;
    if (filterType === 'kt') bcs = bcs.filter(bc => bc.companies.some(c => c.is_kt_client));
    if (filterType === 'non-kt') bcs = bcs.filter(bc => !bc.companies.some(c => c.is_kt_client));

    // Heatmap data
    const heatData = bcs.map(bc => [bc.latitude, bc.longitude, Math.max(bc.companies.filter(c => c.is_kt_client).length * 0.1, bc.companies.reduce((s,c)=>s+(c.accruals||0),0)/1e6)]);
    if (showHeatmap) heatmapRef.current = L.heatLayer(heatData).addTo(map);

    // Business center markers
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

  // Polygon drawing omitted for brevity
  return selectedZone?.type === 'polygon' ? <Polygon positions={selectedZone.points} /> : null;
}

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

  useEffect(() => { setBusinessCenters(data); setProviders(providersData); }, []);
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
          <Route path="/" element={<div className="map-container">             
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
