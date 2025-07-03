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

// Fix default Leaflet markers
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

// Helpers
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
  if (provider.val_download_mbps >= 100) return highSpeedProviderIcon;
  if (provider.val_download_mbps >= 50) return mediumSpeedProviderIcon;
  return lowSpeedProviderIcon;
}

// Navigation
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

// Map legend
function MapLegend({ language, showProviders }) {
  const { t } = useTranslation(language);
  return (
    <Card className="map-legend absolute bottom-4 left-4 z-[1000]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="w-4 h-4" /> {t('legend')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!showProviders ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded-full" />
              <span className="text-xs text-gray-600">{t('regularMarkers')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full" />
              <span className="text-xs text-gray-600">{t('lowPenetrationMarkers')}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-600">{t('highSpeedProviders')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span className="text-xs text-gray-600">{t('mediumSpeedProviders')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-xs text-gray-600">{t('lowSpeedProviders')}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Zone statistics panel
function ZoneStatsPanel({ selectedZone, businessCenters, language }) {
  const { t } = useTranslation(language);
  if (!selectedZone) return null;

  const isPointInPolygon = (point, vs) => {
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      let xi = vs[i][0], yi = vs[i][1];
      let xj = vs[j][0], yj = vs[j][1];
      let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const filteredBCs = businessCenters.filter(bc => {
    if (selectedZone.type === 'polygon') {
      return isPointInPolygon([bc.latitude, bc.longitude], selectedZone.points);
    } else if (selectedZone.type === 'rectangle') {
      const { bounds } = selectedZone;
      return bc.latitude >= bounds.south && bc.latitude <= bounds.north &&
             bc.longitude >= bounds.west && bc.longitude <= bounds.east;
    }
    return false;
  });

  const totalCompanies = filteredBCs.reduce((sum, bc) => sum + bc.companies.length, 0);
  const ktClients = filteredBCs.reduce((sum, bc) =>
    sum + bc.companies.filter(c => c.is_kt_client).length, 0);
  const totalRevenue = filteredBCs.reduce((sum, bc) =>
    sum + bc.companies.reduce((s, c) => s + (c.accruals || 0), 0), 0);

  return (
    <Card className="zone-stats-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> {t('zoneStats')}
        </CardTitle>
        <CardDescription>{t('zoneStatsDescription')}</CardDescription>
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

// Map controls
function MapControls({
  showHeatmap, setShowHeatmap,
  showClusters, setShowClusters,
  showBusinessCenters, setShowBusinessCenters,
  showProviders, setShowProviders,
  zoneSelectionMode, setZoneSelectionMode,
  selectedZone, clearZone,
  filterType, setFilterType,
  language, polygonPoints, finishPolygon
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
        <Button onClick={() => setFilterType('non-kt')} variant={filterType === 'non-kt' ? 'default' : ''}
