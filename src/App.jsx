import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.heat';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Map, BarChart3, Square, Layers, TrendingUp, Building, Users, Languages, Info, Check, Wifi, X } from 'lucide-react';
import AnalyticsPage from './components/AnalyticsPage';
import { useTranslation } from './translations';
import './App.css';
import data from './assets/data.json';
import providersData from './assets/providers_data.json';

// --- НОВЫЙ БЛОК ИКОНОК ---

// Иконка для Бизнес-Центров (Здание)
const createBuildingIcon = (color = '#60A5FA') => { // Default: синий
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1">
             <path d="M4 21V10.083L12 3l8 7.083V21H4zM18 21V11l-6-5.25L6 11v10h12z"/>
             <path d="M9 18h6v-4H9v4zm-2 0h1v-4H7v4zm8 0h1v-4h-1v4zM9 12h6V9H9v3z"/>
           </svg>`,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  } );
};

// Иконка для Провайдеров (Wi-Fi)
const createWifiIcon = (color = '#34D399') => { // Default: зеленый
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="0.5">
             <path d="M12 4.5C7.31 4.5 3.19 6.07 0 8.5l12 12 12-12C20.81 6.07 16.69 4.5 12 4.5z"/>
             <path d="M12 9c-2.97 0-5.74.88-8.07 2.44l8.07 8.07 8.07-8.07C17.74 9.88 14.97 9 12 9z"/>
           </svg>`,
    className: 'custom-leaflet-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  } );
};

// Цвета для иконок
const BC_COLORS = {
  default: '#71717A', // Серый
  lowPenetration: '#F59E0B', // Желтый
};

const PROVIDER_COLORS = {
  highSpeed: '#10B981', // Зеленый
  mediumSpeed: '#F97316', // Оранжевый
  lowSpeed: '#EF4444', // Красный
};

// --- КОНЕЦ НОВОГО БЛОКА ИКОНОК ---

function getPenetrationRate(bc) {
  const total = bc.companies.length;
  const kt = bc.companies.filter(c => c.is_kt_client).length;
  return total === 0 ? 0 : (kt / total) * 100;
}

// --- ОБНОВЛЕННЫЕ ФУНКЦИИ ВЫБОРА ИКОНОК ---

function getIconForBusinessCenter(bc) {
  const penetration = getPenetrationRate(bc);
  if (penetration > 0 && penetration < 30) {
    return createBuildingIcon(BC_COLORS.lowPenetration);
  }
  return createBuildingIcon(BC_COLORS.default);
}

function getIconForProvider(provider) {
  const downloadSpeed = provider.val_download_mbps;
  if (downloadSpeed >= 100) {
    return createWifiIcon(PROVIDER_COLORS.highSpeed);
  } else if (downloadSpeed >= 50) {
    return createWifiIcon(PROVIDER_COLORS.mediumSpeed);
  } else {
    return createWifiIcon(PROVIDER_COLORS.lowSpeed);
  }
}

// --- КОНЕЦ ОБНОВЛЕННЫХ ФУНКЦИЙ ---

function Navigation({ language, setLanguage }) {
  const location = useLocation();
  const { t } = useTranslation(language);
  
  return (
    <div className="bg-white shadow-sm border-b p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src="/kazakhtelecom_logo.png" 
            alt="Казахтелеком" 
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {t('mapTitle')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('mapDescription')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <Link to="/">
            <Button 
              variant={location.pathname === '/' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Map className="w-4 h-4" />
              {t('mapButton')}
            </Button>
          </Link>
          <Link to="/analytics">
            <Button 
              variant={location.pathname === '/analytics' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {t('analyticsButton')}
            </Button>
          </Link>
          
          <Button
            onClick={() => setLanguage(language === 'ru' ? 'kk' : 'ru')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Languages className="w-4 h-4" />
            {language === 'ru' ? 'ҚАЗ' : 'РУС'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MapLegend({ language, showProviders }) {
  const { t } = useTranslation(language);
  
  return (
    <Card className="map-legend absolute bottom-4 left-4 z-[1000]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="w-4 h-4" />
          {t('legend')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5" dangerouslySetInnerHTML={{ __html: createBuildingIcon(BC_COLORS.default).options.html }} />
          <span className="text-xs text-gray-600">{t('regularMarkers')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5" dangerouslySetInnerHTML={{ __html: createBuildingIcon(BC_COLORS.lowPenetration).options.html }} />
          <span className="text-xs text-gray-600">{t('lowPenetrationMarkers')}</span>
        </div>
        {showProviders && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4" dangerouslySetInnerHTML={{ __html: createWifiIcon(PROVIDER_COLORS.highSpeed).options.html }} />
              <span className="text-xs text-gray-600">{t('highSpeedProviders')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4" dangerouslySetInnerHTML={{ __html: createWifiIcon(PROVIDER_COLORS.mediumSpeed).options.html }} />
              <span className="text-xs text-gray-600">{t('mediumSpeedProviders')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4" dangerouslySetInnerHTML={{ __html: createWifiIcon(PROVIDER_COLORS.lowSpeed).options.html }} />
              <span className="text-xs text-gray-600">{t('lowSpeedProviders')}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MapControls({
  showHeatmap, setShowHeatmap, showClusters, setShowClusters,
  zoneSelectionMode, setZoneSelectionMode, selectedZone, clearZone,
  filterType, setFilterType, language, polygonPoints, finishPolygon,
  showProviders, setShowProviders
}) {
  const { t } = useTranslation(language);

  return (
    <div className="map-controls">
      <div className="filter-controls" style={{ marginBottom: '10px' }}>
        <Button onClick={() => setFilterType('all')} variant={filterType === 'all' ? "default" : "outline"} className="flex items-center gap-2"><Users className="w-4 h-4" />{t('allFilter')}</Button>
        <Button onClick={() => setFilterType('kt')} variant={filterType === 'kt' ? "default" : "outline"} className="flex items-center gap-2"><Building className="w-4 h-4" />{t('ktFilter')}</Button>
        <Button onClick={() => setFilterType('non-kt')} variant={filterType === 'non-kt' ? "default" : "outline"} className="flex items-center gap-2"><Building className="w-4 h-4" />{t('nonKtFilter')}</Button>
      </div>
      <div className="layer-controls" style={{ marginBottom: '10px' }}>
        <Button onClick={() => setShowProviders(!showProviders)} variant={showProviders ? "default" : "outline"} className="flex items-center gap-2"><Wifi className="w-4 h-4" />{showProviders ? t('hideProviders') : t('showProviders')}</Button>
        <Button onClick={() => setShowHeatmap(!showHeatmap)} variant={showHeatmap ? "default" : "outline"} className="flex items-center gap-2"><Layers className="w-4 h-4" />{showHeatmap ? t('hideHeatmap') : t('showHeatmap')}</Button>
        <Button onClick={() => setShowClusters(!showClusters)} variant={showClusters ? "default" : "outline"} className="flex items-center gap-2"><Building className="w-4 h-4" />{showClusters ? t('separateMarkers') : t('clustering')}</Button>
      </div>
      <Button onClick={() => setZoneSelectionMode(!zoneSelectionMode)} variant={zoneSelectionMode ? "default" : "outline"} className="flex items-center gap-2"><Square className="w-4 h-4" />{zoneSelectionMode ? t('cancelSelection') : t('selectZone')}</Button>
      {zoneSelectionMode && polygonPoints.length > 2 && (<Button onClick={finishPolygon} variant="default" className="flex items-center gap-2"><Check className="w-4 h-4" />{t('finishSelection')}</Button>)}
      {selectedZone && (<Button onClick={clearZone} variant="destructive" className="flex items-center gap-2">{t('clearZone')}</Button>)}
    </div>
  );
}

function ZoneStatsPanel({ selectedZone, businessCenters, language }) {
  const { t } = useTranslation(language);
  if (!selectedZone) return null;

  const isPointInPolygon = (point, vs) => {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0], yi = vs[i][1];
      const xj = vs[j][0], yj = vs[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const filteredBCs = businessCenters.filter(bc => isPointInPolygon([bc.latitude, bc.longitude], selectedZone.points));
  const totalCompanies = filteredBCs.reduce((sum, bc) => sum + bc.companies.length, 0);
  const ktClients = filteredBCs.reduce((sum, bc) => sum + bc.companies.filter(c => c.is_kt_client).length, 0);
  const totalRevenue = filteredBCs.reduce((sum, bc) => sum + bc.companies.reduce((cs, c) => cs + (c.accruals || 0), 0), 0);

  return (
    <Card className="zone-stats-panel">
      <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5" />{t('zoneStats')}</CardTitle><CardDescription>{t('zoneStatsDescription')}</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between"><span className="text-sm text-gray-600">{t('businessCenters')}</span><Badge variant="secondary">{filteredBCs.length}</Badge></div>
        <div className="flex items-center justify-between"><span className="text-sm text-gray-600">{t('companies')}</span><Badge variant="secondary">{totalCompanies}</Badge></div>
        <div className="flex items-center justify-between"><span className="text-sm text-gray-600">{t('ktClients')}</span><Badge variant="default" className="bg-blue-600">{ktClients}</Badge></div>
        <div className="flex items-center justify-between"><span className="text-sm text-gray-600">{t('totalRevenue')}</span><Badge variant="outline">{totalRevenue.toLocaleString()} {t('currency')}</Badge></div>
      </CardContent>
    </Card>
  );
}

function MapInteractions({
  businessCenters, providers, showHeatmap, showClusters,
  zoneSelectionMode, selectedZone, filterType, onOrganizationClick,
  onBusinessCenterClick, onProviderClick, language, polygonPoints,
  setPolygonPoints, finishPolygon, showProviders
}) {
  const map = useMap();
  const bcLayerRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const providersLayerRef = useRef(null);
  const polygonRef = useRef(null);

  // Effect for Business Centers Layer
  useEffect(() => {
    if (bcLayerRef.current) map.removeLayer(bcLayerRef.current);
    if (heatmapLayerRef.current) map.removeLayer(heatmapLayerRef.current);

    let filteredBCs = businessCenters;
    if (filterType === 'kt') filteredBCs = businessCenters.filter(bc => bc.companies.some(c => c.is_kt_client));
    if (filterType === 'non-kt') filteredBCs = businessCenters.filter(bc => !bc.companies.some(c => c.is_kt_client));

    if (showHeatmap) {
      const heatmapData = filteredBCs.map(bc => [bc.latitude, bc.longitude, getPenetrationRate(bc)]);
      heatmapLayerRef.current = L.heatLayer(heatmapData, { radius: 25, blur: 15, maxZoom: 17, gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' } }).addTo(map);
    }

    const markers = L.markerClusterGroup();
    filteredBCs.forEach(bc => {
      const marker = L.marker([bc.latitude, bc.longitude], { icon: getIconForBusinessCenter(bc) });
      marker.bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language));
      markers.addLayer(marker);
    });
    
    if (showClusters) {
      bcLayerRef.current = markers;
    } else {
      bcLayerRef.current = L.layerGroup(markers.getLayers());
    }
    map.addLayer(bcLayerRef.current);

    return () => {
      if (bcLayerRef.current) map.removeLayer(bcLayerRef.current);
      if (heatmapLayerRef.current) map.removeLayer(heatmapLayerRef.current);
    };
  }, [map, businessCenters, showHeatmap, showClusters, filterType, language, onBusinessCenterClick, onOrganizationClick]);

  // Effect for Providers Layer
  useEffect(() => {
    if (providersLayerRef.current) map.removeLayer(providersLayerRef.current);

    if (showProviders) {
      const providerMarkers = L.markerClusterGroup();
      providers.forEach(provider => {
        const marker = L.marker([provider.attr_location_latitude, provider.attr_location_longitude], { icon: getIconForProvider(provider) });
        marker.bindPopup(renderProviderPopup(provider, onProviderClick, language));
        providerMarkers.addLayer(marker);
      });
      providersLayerRef.current = providerMarkers;
      map.addLayer(providersLayerRef.current);
    }

    return () => {
      if (providersLayerRef.current) map.removeLayer(providersLayerRef.current);
    };
  }, [map, providers, showProviders, language, onProviderClick]);

  // Effect for Polygon Drawing
  useEffect(() => {
    const handleClick = (e) => {
      if (!zoneSelectionMode) return;
      setPolygonPoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
    };
    map.on('click', handleClick);
    map.getContainer().style.cursor = zoneSelectionMode ? 'crosshair' : '';
    return () => map.off('click', handleClick);
  }, [map, zoneSelectionMode, setPolygonPoints]);

  useEffect(() => {
    if (polygonRef.current) map.removeLayer(polygonRef.current);
    if (polygonPoints.length > 1) {
      polygonRef.current = L.polygon(polygonPoints, { color: '#3b82f6', weight: 2, fillOpacity: 0.1 }).addTo(map);
    }
  }, [map, polygonPoints]);

  return selectedZone ? <Polygon positions={selectedZone.points} color="#3b82f6" weight={2} fillOpacity={0.1} /> : null;
}

function ModalCard({ isOpen, onClose, title, description, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <Card className="w-[90%] max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            {title}
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto pr-2">{children}</CardContent>
      </Card>
    </div>
  );
}

function ProviderCard({ provider, isOpen, onClose, language }) {
  const { t } = useTranslation(language);
  return (
    <ModalCard isOpen={isOpen} onClose={onClose} title={provider?.attr_provider_name_common} description={provider?.attr_provider_name}>
      {provider && (
        <div className="space-y-3">
          <div><strong className="text-gray-700">{t('location')}:</strong><p className="text-gray-600">{provider.attr_place_name}, {provider.attr_place_country}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div><strong className="text-gray-700">{t('downloadSpeed')}:</strong><p className="text-green-600 font-semibold text-lg">{provider.val_download_mbps.toFixed(1)} {t('mbps')}</p></div>
            <div><strong className="text-gray-700">{t('uploadSpeed')}:</strong><p className="text-blue-600 font-semibold text-lg">{provider.val_upload_mbps.toFixed(1)} {t('mbps')}</p></div>
          </div>
          <div><strong className="text-gray-700">{t('coordinates')}:</strong><p className="text-gray-600">{provider.attr_location_latitude.toFixed(6)}, {provider.attr_location_longitude.toFixed(6)}</p></div>
        </div>
      )}
    </ModalCard>
  );
}

function OrganizationCard({ organization, isOpen, onClose, language }) {
  const { t } = useTranslation(language);
  return (
    <ModalCard isOpen={isOpen} onClose={onClose} title={organization?.organization_name} description={`${t('bin')}: ${organization?.bin}`}>
      {organization && (
        <div className="space-y-4">
          <div><strong className="text-gray-700">{t('address')}:</strong><p className="text-gray-600">{organization.address}</p></div>
          {organization.accruals > 0 && <div><strong className="text-gray-700">{t('accruals')}:</strong><p className="text-green-600 font-semibold">{organization.accruals.toLocaleString()} {t('currency')}</p></div>}
          {organization.is_kt_client && organization.services?.length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-gray-700 mb-2">{t('ktServices')}</h3>
              <div className="flex flex-wrap gap-2">{organization.services.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}</div>
            </div>
          )}
        </div>
      )}
    </ModalCard>
  );
}

function BusinessCenterCard({ businessCenter, isOpen, onClose, onOrganizationClick, language }) {
  const { t } = useTranslation(language);
  if (!businessCenter) return null;

  const ktClients = businessCenter.companies.filter(c => c.is_kt_client);
  const nonKtClients = businessCenter.companies.filter(c => !c.is_kt_client);
  const totalRevenue = businessCenter.companies.reduce((sum, c) => sum + (c.accruals || 0), 0);

  return (
    <ModalCard isOpen={isOpen} onClose={onClose} title={businessCenter.business_center_name || businessCenter.name} description={businessCenter.address}>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div><strong className="text-gray-700">{t('totalCompanies')}:</strong> {businessCenter.companies.length}</div>
        <div><strong className="text-blue-600">{t('ktClientsCard')}:</strong> {ktClients.length}</div>
        <div className="col-span-2"><strong className="text-green-600">{t('totalRevenue')}:</strong> {totalRevenue.toLocaleString()} {t('currency')}</div>
      </div>
      {[
        { title: t('ktClientsCard'), clients: ktClients },
        { title: t('otherCompanies'), clients: nonKtClients }
      ].map(group => group.clients.length > 0 && (
        <div key={group.title} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">{group.title}</h3>
          <div className="space-y-2">
            {group.clients.map(c => (
              <div key={c.bin} onClick={() => onOrganizationClick(c)} className="p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100">
                <div className="font-medium text-gray-800">{c.organization_name}</div>
                {c.accruals > 0 && <div className="text-sm text-green-600">{c.accruals.toLocaleString()} {t('currency')}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </ModalCard>
  );
}

function renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language) {
  const { t } = useTranslation(language);
  const ktClients = bc.companies.filter(c => c.is_kt_client);
  const totalRevenue = bc.companies.reduce((sum, c) => sum + (c.accruals || 0), 0);
  return `
    <div style="min-width: 250px; max-width: 300px; font-family: sans-serif;">
      <h3 style="margin: 0; font-size: 16px; font-weight: bold; cursor: pointer;" onclick="window.handleBusinessCenterClick('${bc.id}')">${bc.business_center_name || bc.name}</h3>
      <p style="margin: 4px 0 12px 0; font-size: 12px; color: #6b7280;">${bc.address}</p>
      <div style="font-size: 12px; margin-bottom: 4px;">${t('totalCompanies')}: <b>${bc.companies.length}</b></div>
      <div style="font-size: 12px; margin-bottom: 4px;">${t('ktClients')}: <b style="color: #2563eb;">${ktClients.length}</b></div>
      <div style="font-size: 12px; margin-bottom: 12px;">${t('totalRevenue')}: <b style="color: #059669;">${totalRevenue.toLocaleString()} ${t('currency')}</b></div>
      <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${t('ktClientsCard')}</h4>
      <div style="max-height: 120px; overflow-y: auto;">
        ${ktClients.map(c => `<div style="padding: 4px; cursor: pointer;" onclick="window.handleOrganizationClick('${c.bin}')">${c.organization_name}</div>`).join('')}
      </div>
    </div>`;
}

function renderProviderPopup(provider, onProviderClick, language) {
  const { t } = useTranslation(language);
  return `
    <div style="min-width: 200px; font-family: sans-serif;">
      <h3 style="margin: 0; font-size: 16px; font-weight: bold; cursor: pointer;" onclick="window.handleProviderClick('${provider.attr_provider_name}')">${provider.attr_provider_name_common}</h3>
      <p style="margin: 4px 0 12px 0; font-size: 12px; color: #6b7280;">${provider.attr_provider_name}</p>
      <div style="font-size: 12px;">${t('downloadSpeed')}: <b style="color: #059669;">${provider.val_download_mbps.toFixed(1)} ${t('mbps')}</b></div>
      <div style="font-size: 12px;">${t('uploadSpeed')}: <b style="color: #2563eb;">${provider.val_upload_mbps.toFixed(1)} ${t('mbps')}</b></div>
    </div>`;
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

  useEffect(() => {
    setBusinessCenters(data);
    setProviders(providersData);
  }, []);

  useEffect(() => {
    window.handleOrganizationClick = bin => setSelectedOrganization(businessCenters.flatMap(bc => bc.companies).find(c => c.bin === bin));
    window.handleBusinessCenterClick = id => setSelectedBusinessCenter(businessCenters.find(bc => bc.id === id));
    window.handleProviderClick = name => setSelectedProvider(providers.find(p => p.attr_provider_name === name));
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
        <Navigation language={language} setLanguage={setLanguage} />
        <Routes>
          <Route path="/" element={
            <div className="map-container">
              <MapControls {...{ showHeatmap, setShowHeatmap, showClusters, setShowClusters, zoneSelectionMode, setZoneSelectionMode, selectedZone, clearZone, filterType, setFilterType, language, polygonPoints, finishPolygon, showProviders, setShowProviders }} />
              <MapLegend language={language} showProviders={showProviders} />
              <ZoneStatsPanel selectedZone={selectedZone} businessCenters={businessCenters} language={language} />
              <MapContainer center={[51.1694, 71.4491]} zoom={12} style={{ height: 'calc(100vh - 120px)', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                <MapInteractions {...{ businessCenters, providers, showHeatmap, showClusters, zoneSelectionMode, selectedZone, filterType, onOrganizationClick: setSelectedOrganization, onBusinessCenterClick: setSelectedBusinessCenter, onProviderClick: setSelectedProvider, language, polygonPoints, setPolygonPoints, finishPolygon, showProviders }} />
              </MapContainer>
              <OrganizationCard organization={selectedOrganization} isOpen={!!selectedOrganization} onClose={( ) => setSelectedOrganization(null)} language={language} />
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

export default App;
