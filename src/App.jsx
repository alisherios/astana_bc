import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.heat';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Map, BarChart3, Square, Layers, TrendingUp, Building, Users, Languages, Info, Check, Wifi } from 'lucide-react';
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
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const lowPenetrationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  shadowUrl: defaultIcon.options.shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const highSpeedProviderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: defaultIcon.options.shadowUrl,
  iconSize: [20, 32], iconAnchor: [10, 32], popupAnchor: [1, -28], shadowSize: [32, 32]
});
const mediumSpeedProviderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: defaultIcon.options.shadowUrl,
  iconSize: [20, 32], iconAnchor: [10, 32], popupAnchor: [1, -28], shadowSize: [32, 32]
});
const lowSpeedProviderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: defaultIcon.options.shadowUrl,
  iconSize: [20, 32], iconAnchor: [10, 32], popupAnchor: [1, -28], shadowSize: [32, 32]
});

// Helper functions
function getPenetrationRate(bc) {
  const total = bc.companies.length;
  const kt = bc.companies.filter(c => c.is_kt_client).length;
  return total === 0 ? 0 : (kt / total) * 100;
}
function getIconForBusinessCenter(bc) {
  const rate = getPenetrationRate(bc);
  return rate > 0 && rate < 30 ? lowPenetrationIcon : defaultIcon;
}
function getIconForProvider(provider) {
  const speed = provider.val_download_mbps;
  if (speed >= 100) return highSpeedProviderIcon;
  if (speed >= 50) return mediumSpeedProviderIcon;
  return lowSpeedProviderIcon;
}

// Navigation bar
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
              <Map className="w-4 h-4" /> {t('mapButton')}
            </Button>
          </Link>
          <Link to="/analytics">
            <Button variant={location.pathname === '/analytics' ? 'default' : 'outline'} className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> {t('analyticsButton')}
            </Button>
          </Link>
          <Button onClick={() => setLanguage(language === 'ru' ? 'kk' : 'ru')} variant="outline" className="flex items-center gap-2">
            <Languages className="w-4 h-4" /> {language === 'ru' ? 'ҚАЗ' : 'РУС'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Map controls
function MapControls({
  showHeatmap, setShowHeatmap,
  showClusters, setShowClusters,
  showBusinessCenters, setShowBusinessCenters,
  showProviders, setShowProviders,
  zoneSelectionMode, setZoneSelectionMode,
  selectedZone, clearZone,
  filterType, setFilterType,
  language,
  polygonPoints, finishPolygon
}) {
  const { t } = useTranslation(language);

  return (
    <div className="map-controls p-4 space-y-2">
      <div className="flex gap-2">
        <Button onClick={() => setFilterType('all')} variant={filterType === 'all' ? 'default' : 'outline'} className="flex items-center gap-2">
          <Users className="w-4 h-4" /> {t('allFilter')}
        </Button>
        <Button onClick={() => setFilterType('kt')} variant={filterType === 'kt' ? 'default' : 'outline'} className="flex items-center gap-2">
          <Building className="w-4 h-4" /> {t('ktFilter')}
        </Button>
        <Button onClick={() => setFilterType('non-kt')} variant={filterType === 'non-kt' ? 'default' : 'outline'} className="flex items-center gap-2">
          <Building className="w-4 h-4" /> {t('nonKtFilter')}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setShowBusinessCenters(!showBusinessCenters)} variant={showBusinessCenters ? 'default' : 'outline'} className="flex items-center gap-2">
          <Building className="w-4 h-4" /> {showBusinessCenters ? t('hideBusinessCenters') : t('showBusinessCenters')}
        </Button>
        <Button onClick={() => setShowProviders(!showProviders)} variant={showProviders ? 'default' : 'outline'} className="flex items-center gap-2">
          <Wifi className="w-4 h-4" /> {showProviders ? t('hideProviders') : t('showProviders')}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setShowHeatmap(!showHeatmap)} variant={showHeatmap ? 'default' : 'outline'} className="flex items-center gap-2">
          <Layers className="w-4 h-4" /> {showHeatmap ? t('hideHeatmap') : t('showHeatmap')}
        </Button>
        <Button onClick={() => setShowClusters(!showClusters)} variant={showClusters ? 'default' : 'outline'} className="flex items-center gap-2">
          <Building className="w-4 h-4" /> {showClusters ? t('separateMarkers') : t('clustering')}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setZoneSelectionMode(!zoneSelectionMode)} variant={zoneSelectionMode ? 'default' : 'outline'} className="flex items-center gap-2">
          <Square className="w-4 h-4" /> {zoneSelectionMode ? t('cancelSelection') : t('selectZone')}
        </Button>
        {zoneSelectionMode && polygonPoints.length > 2 && (
          <Button onClick={finishPolygon} variant="default" className="flex items-center gap-2">
            <Check className="w-4 h-4" /> {t('finishSelection')}
          </Button>
        )}
        {selectedZone && (
          <Button onClick={clearZone} variant="destructive" className="flex items-center gap-2">
            {t('clearZone')}
          </Button>
        )}
      </div>
    </div>
  );
}

// MapInteractions component (only layers logic shown)
function MapInteractions({
  businessCenters, providers,
  showHeatmap, showClusters,
  showBusinessCenters, showProviders,
  zoneSelectionMode, setZoneSelectionMode,
  selectedZone, setSelectedZone,
  filterType,
  onOrganizationClick, onBusinessCenterClick, onProviderClick,
  language,
  polygonPoints, setPolygonPoints, finishPolygon
}) {
  const map = useMap();
  const markersRef = useRef(null);
  const heatmapRef = useRef(null);
  const providersMarkersRef = useRef(null);
  const currentPolygonRef = useRef(null);

  // Add/cleanup layers
  useEffect(() => {
    if (!map) return;

    // remove old layers
    [markersRef.current, heatmapRef.current, providersMarkersRef.current].forEach(layer => {
      if (layer) map.removeLayer(layer);
    });

    // BUSINESS CENTERS LAYER
    if (showBusinessCenters) {
      let bcs = businessCenters;
      if (filterType === 'kt') {
        bcs = bcs.filter(bc => bc.companies.some(c => c.is_kt_client));
      } else if (filterType === 'non-kt') {
        bcs = bcs.filter(bc => !bc.companies.some(c => c.is_kt_client));
      }

      const heatmapData = bcs.map(bc => {
        const ktCount = bc.companies.filter(c => c.is_kt_client).length;
        const rev = bc.companies.reduce((sum, c) => sum + (c.accruals || 0), 0);
        return [bc.latitude, bc.longitude, Math.max(ktCount * 0.1, rev / 1e6)];
      });

      if (showHeatmap) {
        heatmapRef.current = L.heatLayer(heatmapData, {
          radius: 25, blur: 15, maxZoom: 17,
          gradient: {0.0: 'blue', 0.2: 'cyan', 0.4: 'lime', 0.6: 'yellow', 0.8: 'orange', 1.0: 'red'}
        }).addTo(map);
      }

      if (showClusters) {
        markersRef.current = L.markerClusterGroup();
        bcs.forEach(bc => {
          L.marker([bc.latitude, bc.longitude], { icon: getIconForBusinessCenter(bc) })
            .bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language))
            .addTo(markersRef.current);
        });
        map.addLayer(markersRef.current);
      } else {
        bcs.forEach(bc => {
          L.marker([bc.latitude, bc.longitude], { icon: getIconForBusinessCenter(bc) })
            .bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language))
            .addTo(map);
        });
      }
    }

    // PROVIDERS LAYER
    if (showProviders) {
      providersMarkersRef.current = L.markerClusterGroup({
        iconCreateFunction: cluster => {
          const cnt = cluster.getChildCount();
          let c = ' marker-cluster-';
          c += cnt < 10 ? 'small' : cnt < 100 ? 'medium' : 'large';
          return new L.DivIcon({
            html: `<div><span>${cnt}</span></div>`,
            className: 'marker-cluster' + c,
            iconSize: new L.Point(40, 40)
          });
        }
      });

      providers.forEach(p => {
        L.marker([p.attr_location_latitude, p.attr_location_longitude], { icon: getIconForProvider(p) })
         .bindPopup(renderProviderPopup(p, onProviderClick, language))
         .addTo(providersMarkersRef.current);
      });

      map.addLayer(providersMarkersRef.current);
    }

    return () => {
      if (markersRef.current) map.removeLayer(markersRef.current);
      if (heatmapRef.current) map.removeLayer(heatmapRef.current);
      if (providersMarkersRef.current) map.removeLayer(providersMarkersRef.current);
    };
  }, [
    map, businessCenters, providers,
    showHeatmap, showClusters, filterType,
    showBusinessCenters, showProviders,
    onOrganizationClick, onBusinessCenterClick, onProviderClick, language
  ]);

  // Polygon drawing (omitted for brevity)...

  return (
    selectedZone && selectedZone.type === 'polygon' && (
      <Polygon positions={selectedZone.points} color="#3b82f6" weight={2} fillOpacity={0.1} />
    )
  );
}

// Main App
export default function App() {
  const [businessCenters, setBusinessCenters] = useState([]);
  const [providers, setProviders] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [showBusinessCenters, setShowBusinessCenters] = useState(true);
  const [showProviders, setShowProviders] = useState(false);
  const [zoneSelectionMode, setZoneSelectionMode] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedBusinessCenter, setSelectedBusinessCenter] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [language, setLanguage] = useState('ru');
  const [polygonPoints, setPolygonPoints] = useState([]);

  useEffect(() => {
    setBusinessCenters(data);
    setProviders(providersData);
  }, []);

  useEffect(() => {
    window.handleOrganizationClick = bin => {
      const org = businessCenters.flatMap(bc => bc.companies).find(c => c.bin === bin);
      if (org) setSelectedOrganization(org);
    };
    window.handleBusinessCenterClick = id => {
      const bc = businessCenters.find(x => x.id === id);
      if (bc) setSelectedBusinessCenter(bc);
    };
    window.handleProviderClick = name => {
      const p = providers.find(x => x.attr_provider_name === name);
      if (p) setSelectedProvider(p);
    };
    return () => {
      delete window.handleOrganizationClick;
      delete window.handleBusinessCenterClick;
      delete window.handleProviderClick;
    };
  }, [businessCenters, providers]);

  const clearZone = () => {
    setSelectedZone(null);
    setZoneSelectionMode(false);
    setPolygonPoints([]);
  };

  const finishPolygon = () => {
    if (polygonPoints.length > 2) {
      setSelectedZone({ type: 'polygon', points: polygonPoints });
      setZoneSelectionMode(false);
    } else {
      alert('Пожалуйста, добавьте как минимум 3 точки для создания полигона.');
    }
  };

  return (
    <Router>
      <div className="App">
        <Navigation language={language} setLanguage={      setLanguage} />
        <Routes>
          <Route path="/" element={
            <div className="map-container">
              <MapControls
                showHeatmap={showHeatmap} setShowHeatmap={setShowHeatmap}
                showClusters={showClusters} setShowClusters={setShowClusters}
                showBusinessCenters={showBusinessCenters} setShowBusinessCenters={setShowBusinessCenters}
                showProviders={showProviders} setShowProviders={setShowProviders}
                zoneSelectionMode={zoneSelectionMode} setZoneSelectionMode={setZoneSelectionMode}
                selectedZone={selectedZone} clearZone={clearZone}
                filterType={filterType} setFilterType={setFilterType}
                language={language}
                polygonPoints={polygonPoints} finishPolygon={finishPolygon}
              />
              <MapLegend language={language} showProviders={showProviders} />
              <ZoneStatsPanel selectedZone={selectedZone} businessCenters={businessCenters} language={language} />
              <MapContainer center={[51.1694, 71.4491]} zoom={12} style={{ height: 'calc(100vh - 120px)', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapInteractions
                  businessCenters={businessCenters} providers={providers}
                  showHeatmap={showHeatmap} showClusters={showClusters}
                  showBusinessCenters={showBusinessCenters} showProviders={showProviders}
                  zoneSelectionMode={zoneSelectionMode} setZoneSelectionMode={setZoneSelectionMode}
                  selectedZone={selectedZone} setSelectedZone={setSelectedZone}
                  filterType={filterType}
                  onOrganizationClick={setSelectedOrganization}
                  onBusinessCenterClick={setSelectedBusinessCenter}
                  onProviderClick={setSelectedProvider}
                  language={language}
                  polygonPoints={polygonPoints} setPolygonPoints={setPolygonPoints}
                  finishPolygon={finishPolygon}
                />
              </MapContainer>

              <OrganizationCard organization={selectedOrganization} isOpen={!!selectedOrganization} onClose={() => setSelectedOrganization(null)} language={language} />
              <BusinessCenterCard businessCenter={selectedBusinessCenter} isOpen={!!selectedBusinessCenter} onClose={() => setSelectedBusinessCenter(null)} onOrganizationClick={setSelectedOrganization} language={language} />
              <ProviderCard provider={selectedProvider} isOpen={!!selectedProvider} onClose={() => setSelectedProvider(null)} language={language} />
            </div>
          } />

          <Route path="/analytics" element={<AnalyticsPage businessCenters={businessCenters} language={language} />} />
        </Routes>
      </div>
    </Router>
  );
}
