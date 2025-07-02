import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon } from 'react-leaflet';
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
} );

// --- НОВЫЕ ИКОНКИ ---
// Иконка для Бизнес-Центров (БЦ)
const buildingIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/office/40/company.png', // Пример иконки здания
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  shadowSize: [41, 41]
} );

// Иконка для БЦ с низкой пенетрацией
const lowPenetrationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
} );

// Provider icons based on speed
const highSpeedProviderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
} );

const mediumSpeedProviderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
} );

const lowSpeedProviderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
} );

function getPenetrationRate(bc) {
  const total = bc.companies.length;
  const kt = bc.companies.filter(c => c.is_kt_client).length;
  return total === 0 ? 0 : (kt / total) * 100;
}

function getIconForBusinessCenter(bc) {
  const penetration = getPenetrationRate(bc);
  if (penetration > 0 && penetration < 30) {
    return lowPenetrationIcon;
  }
  return buildingIcon; // Используем новую иконку для БЦ
}

function getIconForProvider(provider) {
  const downloadSpeed = provider.val_download_mbps;
  if (downloadSpeed >= 100) {
    return highSpeedProviderIcon;
  } else if (downloadSpeed >= 50) {
    return mediumSpeedProviderIcon;
  } else {
    return lowSpeedProviderIcon;
  }
}

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
          <img src={buildingIcon.options.iconUrl} alt="BC" className="w-4 h-4" />
          <span className="text-xs text-gray-600">{t('regularMarkers')}</span>
        </div>
        <div className="flex items-center gap-2">
          <img src={lowPenetrationIcon.options.iconUrl} alt="Low Penetration" className="w-4 h-5" />
          <span className="text-xs text-gray-600">{t('lowPenetrationMarkers')}</span>
        </div>

        {showProviders && (
          <>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
              <img src={highSpeedProviderIcon.options.iconUrl} alt="High Speed" className="w-3 h-4" />
              <span className="text-xs text-gray-600">{t('highSpeedProviders')}</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={mediumSpeedProviderIcon.options.iconUrl} alt="Medium Speed" className="w-3 h-4" />
              <span className="text-xs text-gray-600">{t('mediumSpeedProviders')}</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={lowSpeedProviderIcon.options.iconUrl} alt="Low Speed" className="w-3 h-4" />
              <span className="text-xs text-gray-600">{t('lowSpeedProviders')}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MapControls({
  showHeatmap,
  setShowHeatmap,
  showClusters,
  setShowClusters,
  zoneSelectionMode,
  setZoneSelectionMode,
  selectedZone,
  clearZone,
  filterType,
  setFilterType,
  language,
  polygonPoints,
  finishPolygon,
  showProviders,
  setShowProviders
}) {
  const { t } = useTranslation(language);

  return (
    <div className="map-controls">
      <div className="filter-controls" style={{ marginBottom: '10px' }}>
        <Button
          onClick={() => setFilterType('all')}
          variant={filterType === 'all' ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          {t('allFilter')}
        </Button>

        <Button
          onClick={() => setFilterType('kt')}
          variant={filterType === 'kt' ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Building className="w-4 h-4" />
          {t('ktFilter')}
        </Button>

        <Button
          onClick={() => setFilterType('non-kt')}
          variant={filterType === 'non-kt' ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Building className="w-4 h-4" />
          {t('nonKtFilter')}
        </Button>
      </div>

      <div className="layer-controls" style={{ marginBottom: '10px' }}>
        <Button
          onClick={() => setShowProviders(!showProviders)}
          variant={showProviders ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Wifi className="w-4 h-4" />
          {showProviders ? t('hideProviders') : t('showProviders')}
        </Button>
      </div>

      <Button
        onClick={() => setShowHeatmap(!showHeatmap)}
        variant={showHeatmap ? "default" : "outline"}
        className="flex items-center gap-2"
      >
        <Layers className="w-4 h-4" />
        {showHeatmap ? t('hideHeatmap') : t('showHeatmap')}
      </Button>

      <Button
        onClick={() => setShowClusters(!showClusters)}
        variant={showClusters ? "default" : "outline"}
        className="flex items-center gap-2"
      >
        <Building className="w-4 h-4" />
        {showClusters ? t('separateMarkers') : t('clustering')}
      </Button>

      <Button
        onClick={() => setZoneSelectionMode(!zoneSelectionMode)}
        variant={zoneSelectionMode ? "default" : "outline"}
        className="flex items-center gap-2"
      >
        <Square className="w-4 h-4" />
        {zoneSelectionMode ? t('cancelSelection') : t('selectZone')}
      </Button>

      {zoneSelectionMode && polygonPoints.length > 2 && (
        <Button
          onClick={finishPolygon}
          variant="default"
          className="flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          {t('finishSelection')}
        </Button>
      )}

      {selectedZone && (
        <Button
          onClick={clearZone}
          variant="destructive"
          className="flex items-center gap-2"
        >
          {t('clearZone')}
        </Button>
      )}
    </div>
  );
}

function ZoneStatsPanel({ selectedZone, businessCenters, language }) {
  const { t } = useTranslation(language);
  
  if (!selectedZone) return null;

  const isPointInPolygon = (point, vs) => {
    var x = point[0], y = point[1];
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
  };

  const filteredBCs = businessCenters.filter(bc => {
    if (selectedZone.type === 'polygon') {
      return isPointInPolygon([bc.latitude, bc.longitude], selectedZone.points);
    } else if (selectedZone.type === 'rectangle') {
      const { bounds } = selectedZone;
      return bc.latitude >= bounds.south && 
             bc.latitude <= bounds.north && 
             bc.longitude >= bounds.west && 
             bc.longitude <= bounds.east;
    }
    return false;
  });

  const totalCompanies = filteredBCs.reduce((sum, bc) => sum + bc.companies.length, 0);
  const ktClients = filteredBCs.reduce((sum, bc) => 
    sum + bc.companies.filter(company => company.is_kt_client).length, 0
  );
  const totalRevenue = filteredBCs.reduce((sum, bc) => 
    sum + bc.companies.reduce((companySum, company) => companySum + (company.accruals || 0), 0), 0
  );

  return (
    <Card className="zone-stats-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {t('zoneStats')}
        </CardTitle>
        <CardDescription>
          {t('zoneStatsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{t('businessCenters')}</span>
          <Badge variant="secondary">{filteredBCs.length}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{t('companies')}</span>
          <Badge variant="secondary">{totalCompanies}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{t('ktClients')}</span>
          <Badge variant="default" className="bg-blue-600">{ktClients}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{t('totalRevenue')}</span>
          <Badge variant="outline">{totalRevenue.toLocaleString()} {t('currency')}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// --- ИЗМЕНЕННЫЙ КОМПОНЕНТ ДЛЯ ОТОБРАЖЕНИЯ СЛОЕВ ---
function MapInteractions({
  businessCenters,
  providers,
  showHeatmap,
  showClusters,
  zoneSelectionMode,
  selectedZone,
  filterType,
  onOrganizationClick,
  onBusinessCenterClick,
  onProviderClick,
  language,
  polygonPoints,
  setPolygonPoints,
  showProviders
}) {
  const map = useMap();
  const bcMarkersRef = useRef(null); // Слой для БЦ
  const providersMarkersRef = useRef(null); // Слой для провайдеров
  const heatmapRef = useRef(null);
  const currentPolygonRef = useRef(null);

  // Эффект для отображения Бизнес-Центров
  useEffect(() => {
    if (!map) return;

    if (bcMarkersRef.current) map.removeLayer(bcMarkersRef.current);
    if (heatmapRef.current) map.removeLayer(heatmapRef.current);

    let filteredBusinessCenters = businessCenters;
    if (filterType === 'kt') {
      filteredBusinessCenters = businessCenters.filter(bc => bc.companies.some(c => c.is_kt_client));
    } else if (filterType === 'non-kt') {
      filteredBusinessCenters = businessCenters.filter(bc => !bc.companies.some(c => c.is_kt_client));
    }

    if (showHeatmap) {
      const heatmapData = filteredBusinessCenters.map(bc => [bc.latitude, bc.longitude, getPenetrationRate(bc)]);
      heatmapRef.current = L.heatLayer(heatmapData, { radius: 25, blur: 15 }).addTo(map);
    }

    const markerLayer = showClusters ? L.markerClusterGroup() : L.layerGroup();
    filteredBusinessCenters.forEach(bc => {
      const marker = L.marker([bc.latitude, bc.longitude], { icon: getIconForBusinessCenter(bc) });
      marker.bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language));
      markerLayer.addLayer(marker);
    });
    bcMarkersRef.current = markerLayer;
    map.addLayer(bcMarkersRef.current);

    return () => {
      if (bcMarkersRef.current) map.removeLayer(bcMarkersRef.current);
      if (heatmapRef.current) map.removeLayer(heatmapRef.current);
    };
  }, [map, businessCenters, showHeatmap, showClusters, filterType, language, onBusinessCenterClick, onOrganizationClick]);

  // Эффект для отображения Провайдеров
  useEffect(() => {
    if (!map) return;

    if (providersMarkersRef.current) map.removeLayer(providersMarkersRef.current);

    if (showProviders) {
      const providerMarkerLayer = L.markerClusterGroup();
      providers.forEach(provider => {
        const marker = L.marker([provider.attr_location_latitude, provider.attr_location_longitude], { icon: getIconForProvider(provider) });
        marker.bindPopup(renderProviderPopup(provider, onProviderClick, language));
        providerMarkerLayer.addLayer(marker);
      });
      providersMarkersRef.current = providerMarkerLayer;
      map.addLayer(providersMarkersRef.current);
    }

    return () => {
      if (providersMarkersRef.current) map.removeLayer(providersMarkersRef.current);
    };
  }, [map, providers, showProviders, language, onProviderClick]);

  // Handle polygon drawing
  useEffect(() => {
    if (!map) return;

    const handleClick = (e) => {
      if (!zoneSelectionMode) return;
      setPolygonPoints(prevPoints => [...prevPoints, [e.latlng.lat, e.latlng.lng]]);
    };

    if (zoneSelectionMode) {
      map.on('click', handleClick);
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.off('click', handleClick);
      map.getContainer().style.cursor = '';
    }

    return () => {
      map.off('click', handleClick);
    };
  }, [map, zoneSelectionMode, setPolygonPoints]);

  useEffect(() => {
    if (currentPolygonRef.current) map.removeLayer(currentPolygonRef.current);
    if (polygonPoints.length > 1) {
      currentPolygonRef.current = L.polygon(polygonPoints, { color: '#3b82f6', weight: 2, fillOpacity: 0.1 }).addTo(map);
    }
  }, [map, polygonPoints]);

  return (
    selectedZone && selectedZone.type === 'polygon' && (
      <Polygon positions={selectedZone.points} color="#3b82f6" weight={2} fillOpacity={0.1} />
    )
  );
}

function ProviderCard({ provider, isOpen, onClose, language }) {
  const { t } = useTranslation(language);
  
  if (!isOpen || !provider) return null;

  return (
    <div className="provider-card-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }}>
      <div className="provider-card bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-lg">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-800">{provider.attr_provider_name_common}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">×</button>
        </div>
        <div className="space-y-3">
          <div><strong className="text-gray-700">{t('providerName')}</strong><p className="text-gray-600">{provider.attr_provider_name}</p></div>
          <div><strong className="text-gray-700">{t('location')}</strong><p className="text-gray-600">{provider.attr_place_name}, {provider.attr_place_country}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div><strong className="text-gray-700">{t('downloadSpeed')}</strong><p className="text-green-600 font-semibold text-lg">{provider.val_download_mbps.toFixed(1)} {t('mbps')}</p></div>
            <div><strong className="text-gray-700">{t('uploadSpeed')}</strong><p className="text-blue-600 font-semibold text-lg">{provider.val_upload_mbps.toFixed(1)} {t('mbps')}</p></div>
          </div>
          <div><strong className="text-gray-700">{t('coordinates')}</strong><p className="text-gray-600">{provider.attr_location_latitude.toFixed(6)}, {provider.attr_location_longitude.toFixed(6)}</p></div>
        </div>
      </div>
    </div>
  );
}

function OrganizationCard({ organization, isOpen, onClose, language }) {
  const { t } = useTranslation(language);
  
  if (!isOpen || !organization) return null;

  return (
    <div className="organization-card-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }}>
      <div className="organization-card bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-800">{organization.organization_name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">×</button>
        </div>
        <div className="space-y-2">
          <div><strong className="text-gray-700">{t('bin')}:</strong> <span className="text-gray-600">{organization.bin}</span></div>
          <div><strong className="text-gray-700">{t('address')}:</strong> <span className="text-gray-600">{organization.address}</span></div>
          {organization.accruals > 0 && (
            <div><strong className="text-gray-700">{t('accruals')}:</strong> <span className="text-green-600 font-semibold">{organization.accruals.toLocaleString()} {t('currency')}</span></div>
          )}
        </div>
        {organization.is_kt_client && organization.services && organization.services.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('ktServices')}</h3>
            <div className="flex flex-wrap gap-2">
              {organization.services.map((service, index) => (
                <Badge key={index} variant="secondary">{service}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessCenterCard({ businessCenter, isOpen, onClose, onOrganizationClick, language }) {
  const { t } = useTranslation(language);
  
  if (!isOpen || !businessCenter) return null;

  const ktClients = businessCenter.companies.filter(c => c.is_kt_client);
  const nonKtClients = businessCenter.companies.filter(c => !c.is_kt_client);
  const totalRevenue = businessCenter.companies.reduce((sum, c) => sum + (c.accruals || 0), 0);

  return (
    <div className="business-center-card-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }}>
      <div className="business-center-card bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{businessCenter.business_center_name || businessCenter.name || 'Неизвестный БЦ'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">×</button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><strong className="text-gray-700">{t('address')}:</strong><p className="text-gray-600">{businessCenter.address}</p></div>
          <div><strong className="text-gray-700">{t('totalCompanies')}:</strong><p className="text-gray-600">{businessCenter.companies.length}</p></div>
          <div><strong className="text-gray-700">{t('ktClientsCard')}:</strong><p className="text-blue-600 font-semibold">{ktClients.length}</p></div>
          <div><strong className="text-gray-700">{t('totalRevenue')}:</strong><p className="text-green-600 font-semibold">{totalRevenue.toLocaleString()} {t('currency')}</p></div>
        </div>
        <div className="flex-grow overflow-y-auto pr-2">
          {ktClients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">{t('ktClientsCard')}</h3>
              <div className="space-y-2">
                {ktClients.map((company, index) => (
                  <div key={index} onClick={() => onOrganizationClick(company)} className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                    <div className="font-medium text-gray-800">{company.organization_name}</div>
                    {company.accruals > 0 && <div className="text-sm text-green-600">{company.accruals.toLocaleString()} {t('currency')}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {nonKtClients.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">{t('otherCompanies')}</h3>
              <div className="space-y-2">
                {nonKtClients.map((company, index) => (
                  <div key={index} onClick={() => onOrganizationClick(company)} className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                    <div className="font-medium text-gray-800">{company.organization_name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language) {
  const { t } = useTranslation(language);
  const ktClients = bc.companies.filter(c => c.is_kt_client);
  const totalRevenue = bc.companies.reduce((sum, c) => sum + (c.accruals || 0), 0);
  const businessCenterName = bc.business_center_name || bc.name || 'Неизвестный БЦ';

  return `
    <div style="min-width: 250px; max-width: 300px; font-family: sans-serif;">
      <h3 style="margin: 0; font-size: 16px; font-weight: bold; cursor: pointer;" onclick="window.handleBusinessCenterClick('${bc.id}')">${businessCenterName}</h3>
      <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">${bc.address}</p>
      <div style="font-size: 12px; margin-top: 8px;">
        <div>${t('totalCompanies')}: <b>${bc.companies.length}</b></div>
        <div>${t('ktClients')}: <b style="color: #2563eb;">${ktClients.length}</b></div>
        <div>${t('totalRevenue')}: <b style="color: #059669;">${totalRevenue.toLocaleString()} ${t('currency')}</b></div>
      </div>
    </div>
  `;
}

function renderProviderPopup(provider, onProviderClick, language) {
  const { t } = useTranslation(language);
  return `
    <div style="min-width: 200px; font-family: sans-serif;">
      <h3 style="margin: 0; font-size: 16px; font-weight: bold; cursor: pointer;" onclick="window.handleProviderClick('${provider.attr_provider_name}')">${provider.attr_provider_name_common}</h3>
      <div style="font-size: 12px; margin-top: 8px;">
        <div>${t('downloadSpeed')}: <b style="color: #059669;">${provider.val_download_mbps.toFixed(1)} ${t('mbps')}</b></div>
        <div>${t('uploadSpeed')}: <b style="color: #2563eb;">${provider.val_upload_mbps.toFixed(1)} ${t('mbps')}</b></div>
      </div>
    </div>
  `;
}

// --- НАЧАЛО ОСТАТКА ФАЙЛА ---

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
    // Global handlers for popup clicks
    window.handleOrganizationClick = (bin) => {
      const organization = businessCenters
        .flatMap(bc => bc.companies)
        .find(company => company.bin === bin);
      if (organization) {
        setSelectedOrganization(organization);
      }
    };

    window.handleBusinessCenterClick = (bcId) => {
      const businessCenter = businessCenters.find(bc => bc.id === bcId);
      if (businessCenter) {
        setSelectedBusinessCenter(businessCenter);
      }
    };

    window.handleProviderClick = (providerName) => {
      const provider = providers.find(p => p.attr_provider_name === providerName);
      if (provider) {
        setSelectedProvider(provider);
      }
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
      setSelectedZone({
        type: 'polygon',
        points: polygonPoints
      });
      setZoneSelectionMode(false);
    } else {
      alert('Пожалуйста, добавьте как минимум 3 точки для создания полигона.');
    }
  };

  const handleOrganizationClick = (organization) => {
    setSelectedOrganization(organization);
  };

  const handleBusinessCenterClick = (businessCenter) => {
    setSelectedBusinessCenter(businessCenter);
  };

  const handleProviderClick = (provider) => {
    setSelectedProvider(provider);
  };

  return (
    <Router>
      <div className="App">
        <Navigation language={language} setLanguage={setLanguage} />
        
        <Routes>
          <Route path="/" element={
            <div className="map-container">
              <MapControls 
                showHeatmap={showHeatmap}
                setShowHeatmap={setShowHeatmap}
                showClusters={showClusters}
                setShowClusters={setShowClusters}
                zoneSelectionMode={zoneSelectionMode}
                setZoneSelectionMode={setZoneSelectionMode}
                selectedZone={selectedZone}
                clearZone={clearZone}
                filterType={filterType}
                setFilterType={setFilterType}
                language={language}
                polygonPoints={polygonPoints}
                finishPolygon={finishPolygon}
                showProviders={showProviders}
                setShowProviders={setShowProviders}
              />
              
              <MapLegend language={language} showProviders={showProviders} />
              
              <ZoneStatsPanel 
                selectedZone={selectedZone}
                businessCenters={businessCenters}
                language={language}
              />
              
              <MapContainer 
                center={[51.1694, 71.4491]} 
                zoom={12} 
                style={{ height: 'calc(100vh - 120px)', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapInteractions 
                  businessCenters={businessCenters}
                  providers={providers}
                  showHeatmap={showHeatmap}
                  showClusters={showClusters}
                  zoneSelectionMode={zoneSelectionMode}
                  selectedZone={selectedZone}
                  filterType={filterType}
                  onOrganizationClick={handleOrganizationClick}
                  onBusinessCenterClick={handleBusinessCenterClick}
                  onProviderClick={handleProviderClick}
                  language={language}
                  polygonPoints={polygonPoints}
                  setPolygonPoints={setPolygonPoints}
                  showProviders={showProviders}
                />
              </MapContainer>
              
              <OrganizationCard 
                organization={selectedOrganization}
                isOpen={!!selectedOrganization}
                onClose={( ) => setSelectedOrganization(null)}
                language={language}
              />
              
              <BusinessCenterCard 
                businessCenter={selectedBusinessCenter}
                isOpen={!!selectedBusinessCenter}
                onClose={() => setSelectedBusinessCenter(null)}
                onOrganizationClick={handleOrganizationClick}
                language={language}
              />

              <ProviderCard 
                provider={selectedProvider}
                isOpen={!!selectedProvider}
                onClose={() => setSelectedProvider(null)}
                language={language}
              />
            </div>
          } />
          <Route path="/analytics" element={<AnalyticsPage businessCenters={businessCenters} language={language} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
