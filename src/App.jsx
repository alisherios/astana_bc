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

// Custom icon for KT clients
const ktClientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Default icon for regular business centers
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const lowPenetrationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Provider icons based on speed
const highSpeedProviderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

const mediumSpeedProviderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

const lowSpeedProviderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

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
        {/* Business Center Legend (always visible) */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
          <span className="text-xs text-gray-600">{t('regularMarkers')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
          <span className="text-xs text-gray-600">{t('lowPenetrationMarkers')}</span>
        </div>

        {/* Provider Legend (visible only if layer is active) */}
        {showProviders && (
          <>
            <hr className="my-2 border-t border-gray-200" />
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
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

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

  useEffect(() => {
    if (!map) return;

    // --- Clear existing layers ---
    if (markersRef.current) {
      map.removeLayer(markersRef.current);
    }
    if (heatmapRef.current) {
      map.removeLayer(heatmapRef.current);
    }
    if (providersMarkersRef.current) {
      map.removeLayer(providersMarkersRef.current);
    }
    if (currentPolygonRef.current) {
        map.removeLayer(currentPolygonRef.current);
    }

    // --- Provider Layer Logic ---
    if (showProviders && providers && providers.length > 0) {
      providersMarkersRef.current = L.markerClusterGroup({
        iconCreateFunction: function(cluster) {
          const count = cluster.getChildCount();
          let c = ' marker-cluster-';
          if (count < 10) c += 'small';
          else if (count < 100) c += 'medium';
          else c += 'large';
          return new L.DivIcon({
            html: `<div><span>${count}</span></div>`,
            className: 'marker-cluster' + c,
            iconSize: new L.Point(40, 40)
          });
        }
      });

      providers.forEach(provider => {
        const marker = L.marker([provider.attr_location_latitude, provider.attr_location_longitude], {
          icon: getIconForProvider(provider)
        });
        marker.bindPopup(renderProviderPopup(provider, onProviderClick, language));
        providersMarkersRef.current.addLayer(marker);
      });

      map.addLayer(providersMarkersRef.current);
    }

    // --- Business Center Layer Logic (runs independently) ---
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

    // Heatmap Layer
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

    // Marker Layer (Clustered or Individual)
    if (filteredBusinessCenters && filteredBusinessCenters.length > 0) {
      if (showClusters) {
      markersRef.current = L.markerClusterGroup({
        iconCreateFunction: function(cluster) {
          const count = cluster.getChildCount();
          let c = ' marker-cluster-';
          if (count < 10) c += 'small';
          else if (count < 100) c += 'medium';
          else c += 'large';
          return new L.DivIcon({
            html: '<div><span>' + count + '</span></div>',
            className: 'marker-cluster' + c,
            iconSize: new L.Point(40, 40)
          });
        }
      });

      filteredBusinessCenters.forEach(bc => {
        const marker = L.marker([bc.latitude, bc.longitude], {
          icon: getIconForBusinessCenter(bc)
        });
        marker.bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language));
        markersRef.current.addLayer(marker);
          } else {
        if (filteredBusinessCenters && filteredBusinessCenters.length > 0) {
          markersRef.current = L.layerGroup(); // Use a layer group for individual markers
          filteredBusinessCenters.forEach(bc => {
        const marker = L.marker([bc.latitude, bc.longitude], {
          icon: getIconForBusinessCenter(bc)
        });
        marker.bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language));
        markersRef.current.addLayer(marker);
      });
    }
    map.addLayer(markersRef.current);

    // Cleanup function
    return () => {
      if (markersRef.current) map.removeLayer(markersRef.current);
      if (heatmapRef.current) map.removeLayer(heatmapRef.current);
      if (providersMarkersRef.current) map.removeLayer(providersMarkersRef.current);
    };
  }, [map, businessCenters, providers, showHeatmap, showClusters, filterType, onOrganizationClick, onBusinessCenterClick, onProviderClick, language, showProviders]);

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
      if (currentPolygonRef.current) {
        map.removeLayer(currentPolygonRef.current);
      }
    }

    return () => {
      map.off('click', handleClick);
      map.getContainer().style.cursor = '';
    };
  }, [map, zoneSelectionMode, setPolygonPoints]);

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
            <strong className="text-gray-700">{t('ktClientsCount')}</strong>
            <p className="text-blue-600 font-semibold">{ktClients.length}</p>
          </div>
          <div>
            <strong className="text-gray-700">{t('nonKtClientsCount')}</strong>
            <p className="text-red-600 font-semibold">{nonKtClients.length}</p>
          </div>
          <div>
            <strong className="text-gray-700">{t('totalRevenue')}</strong>
            <p className="text-green-600 font-semibold">{totalRevenue.toLocaleString()} {t('currency')}</p>
          </div>
          <div>
            <strong className="text-gray-700">{t('penetrationRate')}</strong>
            <p className="text-purple-600 font-semibold">{getPenetrationRate(businessCenter).toFixed(2)}%</p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-3">{t('companiesInBC')}</h3>
        <div className="overflow-y-auto flex-grow pr-2">
          {businessCenter.companies.length > 0 ? (
            <ul className="space-y-2">
              {businessCenter.companies.map((company, index) => (
                <li key={index} className="border rounded-md p-3 flex items-center justify-between bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800">{company.organization_name}</p>
                    <p className="text-sm text-gray-500">БИН: {company.bin}</p>
                  </div>
                  {company.is_kt_client ? (
                    <Badge className="bg-blue-500 hover:bg-blue-600">{t('ktClient')}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600 border-gray-300">{t('potentialClient')}</Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onOrganizationClick(company)}>
                    {t('details')}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">{t('noCompanies')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to render company popup content
function renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language) {
  const { t } = useTranslation(language);
  const ktClientsCount = bc.companies.filter(c => c.is_kt_client).length;
  const totalRevenue = bc.companies.reduce((sum, c) => sum + (c.accruals || 0), 0);

  let companiesHtml = '';
  if (bc.companies.length > 0) {
    companiesHtml = `
      <h4 style="font-weight: bold; margin-top: 10px; margin-bottom: 5px;">${t('companies')}:</h4>
      <ul style="list-style: none; padding: 0;">
        ${bc.companies.slice(0, 3).map(company => `
          <li style="margin-bottom: 3px;">
            ${company.organization_name} ${company.is_kt_client ? `<span style="color: #2563eb; font-weight: bold;">(${t('ktClientShort')})</span>` : ''}
          </li>
        `).join('')}
        ${bc.companies.length > 3 ? `<li>...</li>` : ''}
      </ul>
    `;
  }

  return `
    <div style="font-family: sans-serif; font-size: 14px; color: #333;">
      <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #1f2937;">${bc.business_center_name || bc.name || t('unknownBC')}</h3>
      <p style="margin: 0 0 5px 0;"><strong>${t('address')}:</strong> ${bc.address}</p>
      <p style="margin: 0 0 5px 0;"><strong>${t('totalCompanies')}:</strong> ${bc.companies.length}</p>
      <p style="margin: 0 0 5px 0;"><strong>${t('ktClientsCount')}:</strong> <span style="color: #2563eb; font-weight: bold;">${ktClientsCount}</span></p>
      ${totalRevenue > 0 ? `<p style="margin: 0 0 5px 0;"><strong>${t('totalRevenue')}:</strong> <span style="color: #059669; font-weight: bold;">${totalRevenue.toLocaleString()} ${t('currency')}</span></p>` : ''}
      ${companiesHtml}
      <button 
        onclick="window.handleBusinessCenterClick('${bc.id}')"
        style="
          background-color: #3b82f6;
          color: white;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 10px;
          width: 100%;
        "
      >${t('viewDetails')}</button>
    </div>
  `;
}

// Helper function to render provider popup content
function renderProviderPopup(provider, onProviderClick, language) {
  const { t } = useTranslation(language);
  return `
    <div style="font-family: sans-serif; font-size: 14px; color: #333;">
      <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #1f2937;">${provider.attr_provider_name_common}</h3>
      <p style="margin: 0 0 5px 0;"><strong>${t('location')}:</strong> ${provider.attr_place_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>${t('downloadSpeed')}:</strong> <span style="color: #22c55e; font-weight: bold;">${provider.val_download_mbps.toFixed(1)} ${t('mbps')}</span></p>
      <p style="margin: 0 0 5px 0;"><strong>${t('uploadSpeed')}:</strong> <span style="color: #3b82f6; font-weight: bold;">${provider.val_upload_mbps.toFixed(1)} ${t('mbps')}</span></p>
      <button 
        onclick="window.handleProviderClick('${provider.attr_provider_name}')"
        style="
          background-color: #3b82f6;
          color: white;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 10px;
          width: 100%;
        "
      >${t('viewDetails')}</button>
    </div>
  `;
}

function App() {
  const [language, setLanguage] = useState('ru');
  const { t } = useTranslation(language);

  const [businessCenters, setBusinessCenters] = useState([]);
  const [providers, setProviders] = useState([]);

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [showProviders, setShowProviders] = useState(false); // New state for providers layer

  const [zoneSelectionMode, setZoneSelectionMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);

  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedBusinessCenter, setSelectedBusinessCenter] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null); // New state for selected provider

  const [filterType, setFilterType] = useState('all'); // 'all', 'kt', 'non-kt'

  useEffect(() => {
    setBusinessCenters(data.business_centers);
    setProviders(providersData.providers);
  }, []);

  // Expose functions to global window object for Leaflet popups
  useEffect(() => {
    window.handleOrganizationClick = (bin) => {
      const org = businessCenters.flatMap(bc => bc.companies).find(c => c.bin === bin);
      setSelectedOrganization(org);
    };
    window.handleBusinessCenterClick = (id) => {
      const bc = businessCenters.find(b => b.id === id);
      setSelectedBusinessCenter(bc);
    };
    window.handleProviderClick = (name) => {
      const provider = providers.find(p => p.attr_provider_name === name);
      setSelectedProvider(provider);
    };
  }, [businessCenters, providers]);

  const clearZone = () => {
    setSelectedZone(null);
    setPolygonPoints([]);
    setZoneSelectionMode(false);
  };

  const finishPolygon = () => {
    if (polygonPoints.length > 2) {
      setSelectedZone({ type: 'polygon', points: polygonPoints });
      setZoneSelectionMode(false);
    }
  };

  return (
    <Router>
      <div className="flex flex-col h-screen">
        <Navigation language={language} setLanguage={setLanguage} />
        <div className="flex-grow relative">
          <Routes>
            <Route path="/" element={
              <>
                <MapContainer
                  center={[43.238949, 76.889709]} // Almaty coordinates
                  zoom={13}
                  scrollWheelZoom={true}
                  className="h-full w-full"
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
                    setZoneSelectionMode={setZoneSelectionMode}
                    selectedZone={selectedZone}
                    setSelectedZone={setSelectedZone}
                    filterType={filterType}
                    onOrganizationClick={setSelectedOrganization}
                    onBusinessCenterClick={setSelectedBusinessCenter}
                    onProviderClick={setSelectedProvider}
                    language={language}
                    polygonPoints={polygonPoints}
                    setPolygonPoints={setPolygonPoints}
                    finishPolygon={finishPolygon}
                    showProviders={showProviders}
                  />
                  {selectedZone && selectedZone.type === 'polygon' && (
                    <Polygon positions={selectedZone.points} color="#3b82f6" weight={2} fillOpacity={0.1} />
                  )}
                </MapContainer>

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

                <ZoneStatsPanel
                  selectedZone={selectedZone}
                  businessCenters={businessCenters}
                  language={language}
                />

                <MapLegend language={language} showProviders={showProviders} />

                <OrganizationCard
                  organization={selectedOrganization}
                  isOpen={!!selectedOrganization}
                  onClose={() => setSelectedOrganization(null)}
                  language={language}
                />
                <BusinessCenterCard
                  businessCenter={selectedBusinessCenter}
                  isOpen={!!selectedBusinessCenter}
                  onClose={() => setSelectedBusinessCenter(null)}
                  onOrganizationClick={setSelectedOrganization}
                  language={language}
                />
                <ProviderCard
                  provider={selectedProvider}
                  isOpen={!!selectedProvider}
                  onClose={() => setSelectedProvider(null)}
                  language={language}
                />
              </>
            } />
            <Route path="/analytics" element={<AnalyticsPage language={language} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;


