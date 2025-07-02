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
} );

// Custom icon for KT clients
const ktClientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
} );

// Default icon for regular business centers
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
} );

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
  return defaultIcon;
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
          {/* Логотип Казахтелеком */}
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
          
          {/* Language Toggle Button */}
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

// Component for map legend
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
        {/* Always show BC legend */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
          <span className="text-xs text-gray-600">{t('regularMarkers')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
          <span className="text-xs text-gray-600">{t('lowPenetrationMarkers')}</span>
        </div>
        
        {/* Show provider legend only when they are visible */}
        {showProviders && (
          <>
            <hr className="my-2"/>
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

// Component for map controls and zone selection
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

// Component for zone statistics panel
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

// Component for handling map interactions
function MapInteractions({
  businessCenters,
  providers,
  showHeatmap,
  showClusters,
  zoneSelectionMode,
  setZoneSelectionMode,
  selectedZone,
  setSelectedZone,
  filterType,
  onOrganizationClick,
  onBusinessCenterClick,
  onProviderClick,
  language,
  polygonPoints,
  setPolygonPoints,
  finishPolygon,
  showProviders
}) {
  const map = useMap();
  const markersRef = useRef(null);
  const heatmapRef = useRef(null);
  const currentPolygonRef = useRef(null);
  const providersMarkersRef = useRef(null);

  // Effect for displaying business centers
  useEffect(() => {
    if (!map) return;

    // Clear old BC layers
    if (markersRef.current) {
      map.removeLayer(markersRef.current);
      markersRef.current = null;
    }
    if (heatmapRef.current) {
      map.removeLayer(heatmapRef.current);
      heatmapRef.current = null;
    }

    // Filter business centers
    let filteredBusinessCenters = businessCenters;
    if (filterType === 'kt') {
      filteredBusinessCenters = businessCenters.filter(bc =>
        bc.companies.some(company => company.is_kt_client)
      );
    } else if (filterType === 'non-kt') {
      filteredBusinessCenters = businessCenters.filter(bc =>
        !bc.companies.some(company => company.is_kt_client)
      );
    }

    // Heatmap layer (if enabled)
    if (showHeatmap) {
      const heatmapData = filteredBusinessCenters.map(bc => {
        const ktClientsCount = bc.companies.filter(c => c.is_kt_client).length;
        const totalRevenue = bc.companies.reduce((sum, c) => sum + (c.accruals || 0), 0);
        const intensity = Math.max(ktClientsCount * 0.1, totalRevenue / 1000000);
        return [bc.latitude, bc.longitude, intensity];
      });
      heatmapRef.current = L.heatLayer(heatmapData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: { 0.0: 'blue', 0.2: 'cyan', 0.4: 'lime', 0.6: 'yellow', 0.8: 'orange', 1.0: 'red' }
      }).addTo(map);
    }

    // BC markers (clustered or individual)
    const markerLayer = showClusters ? L.markerClusterGroup() : L.layerGroup();
    filteredBusinessCenters.forEach(bc => {
      const marker = L.marker([bc.latitude, bc.longitude], { icon: getIconForBusinessCenter(bc) });
      marker.bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language));
      markerLayer.addLayer(marker);
    });
    markersRef.current = markerLayer;
    map.addLayer(markersRef.current);

    return () => {
      if (markersRef.current) {
        map.removeLayer(markersRef.current);
      }
      if (heatmapRef.current) {
        map.removeLayer(heatmapRef.current);
      }
    };
  }, [map, businessCenters, showHeatmap, showClusters, filterType, onOrganizationClick, onBusinessCenterClick, language]);

  // Separate effect for displaying providers
  useEffect(() => {
    if (!map) return;

    // If providers should be shown and the layer doesn't exist yet
    if (showProviders && !providersMarkersRef.current) {
      providersMarkersRef.current = L.markerClusterGroup(); // Always cluster providers for performance
      providers.forEach(provider => {
        const marker = L.marker([provider.attr_location_latitude, provider.attr_location_longitude], {
          icon: getIconForProvider(provider)
        });
        marker.bindPopup(renderProviderPopup(provider, onProviderClick, language));
        providersMarkersRef.current.addLayer(marker);
      });
      map.addLayer(providersMarkersRef.current);
    }
    // If providers should be hidden and the layer exists
    else if (!showProviders && providersMarkersRef.current) {
      map.removeLayer(providersMarkersRef.current);
      providersMarkersRef.current = null;
    }

    // Cleanup function for when the component unmounts
    return () => {
      if (providersMarkersRef.current) {
        map.removeLayer(providersMarkersRef.current);
        providersMarkersRef.current = null;
      }
    };
  }, [map, providers, showProviders, onProviderClick, language]);

  // Effect for polygon drawing (remains unchanged)
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
      if (currentPolygonRef.current) {
        map.removeLayer(currentPolygonRef.current);
      }
    }

    return () => {
      map.off('click', handleClick);
      map.getContainer().style.cursor = '';
    };
  }, [map, zoneSelectionMode, setPolygonPoints]);

  // Effect for rendering the current polygon (remains unchanged)
  useEffect(() => {
    if (currentPolygonRef.current) {
      map.removeLayer(currentPolygonRef.current);
    }
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

// Component for provider card modal
function ProviderCard({ provider, isOpen, onClose, language }) {
  const { t } = useTranslation(language);
  
  if (!isOpen || !provider) return null;

  return (
    <div className="provider-card-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div className="provider-card bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-lg">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {provider.attr_provider_name_common}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <strong className="text-gray-700">{t('providerName')}</strong>
            <p className="text-gray-600">{provider.attr_provider_name}</p>
          </div>
          <div>
            <strong className="text-gray-700">{t('location')}</strong>
            <p className="text-gray-600">{provider.attr_place_name}, {provider.attr_place_country}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong className="text-gray-700">{t('downloadSpeed')}</strong>
              <p className="text-green-600 font-semibold text-lg">
                {provider.val_download_mbps.toFixed(1)} {t('mbps')}
              </p>
            </div>
            <div>
              <strong className="text-gray-700">{t('uploadSpeed')}</strong>
              <p className="text-blue-600 font-semibold text-lg">
                {provider.val_upload_mbps.toFixed(1)} {t('mbps')}
              </p>
            </div>
          </div>
          <div>
            <strong className="text-gray-700">{t('coordinates')}</strong>
            <p className="text-gray-600">
              {provider.attr_location_latitude.toFixed(6)}, {provider.attr_location_longitude.toFixed(6)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for organization card modal
function OrganizationCard({ organization, isOpen, onClose, language }) {
  const { t } = useTranslation(language);
  
  if (!isOpen || !organization) return null;

  return (
    <div className="organization-card-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div className="organization-card" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            {organization.organization_name}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0',
              marginLeft: '16px'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#374151' }}>{t('bin')}</strong>
            <span style={{ marginLeft: '8px', color: '#6b7280' }}>{organization.bin}</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#374151' }}>{t('address')}</strong>
            <span style={{ marginLeft: '8px', color: '#6b7280' }}>{organization.address}</span>
          </div>
          {organization.accruals > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#374151' }}>{t('accruals')}</strong>
              <span style={{ marginLeft: '8px', color: '#059669', fontWeight: '600' }}>
                {organization.accruals.toLocaleString()} {t('currency')}
              </span>
            </div>
          )}
        </div>

        {organization.is_kt_client && organization.services && organization.services.length > 0 && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
              {t('ktServices')}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {organization.services.map((service, index) => (
                <span 
                  key={index}
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for business center card modal
function BusinessCenterCard({ businessCenter, isOpen, onClose, onOrganizationClick, language }) {
  const { t } = useTranslation(language);
  
  if (!isOpen || !businessCenter) return null;

  const ktClients = businessCenter.companies.filter(c => c.is_kt_client);
  const nonKtClients = businessCenter.companies.filter(c => !c.is_kt_client);
  const totalRevenue = businessCenter.companies.reduce((sum, c) => sum + (c.accruals || 0), 0);

  return (
    <div className="business-center-card-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div className="business-center-card bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {businessCenter.business_center_name || businessCenter.name || 'Неизвестный БЦ'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <strong className="text-gray-700">{t('address')}</strong>
            <p className="text-gray-600">{businessCenter.address}</p>
          </div>
          <div>
            <strong className="text-gray-700">{t('totalCompanies')}</strong>
            <p className="text-gray-600">{businessCenter.companies.length}</p>
          </div>
          <div>
            <strong className="text-gray-700">{t('ktClientsCard')}</strong>
            <p className="text-blue-600 font-semibold">{ktClients.length}</p>
          </div>
          <div>
            <strong className="text-gray-700">{t('totalRevenue')}</strong>
            <p className="text-green-600 font-semibold">
              {totalRevenue.toLocaleString()} {t('currency')}
            </p>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          {ktClients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                {t('ktClientsCard')}
              </h3>
              <div className="space-y-2">
                {ktClients.map((company
