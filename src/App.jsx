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

// ... остальные компоненты остаются без изменений ...

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

    // Очищаем предыдущие слои
    if (markersRef.current) {
      map.removeLayer(markersRef.current);
      markersRef.current = null;
    }
    if (heatmapRef.current) {
      map.removeLayer(heatmapRef.current);
      heatmapRef.current = null;
    }
    if (providersMarkersRef.current) {
      map.removeLayer(providersMarkersRef.current);
      providersMarkersRef.current = null;
    }

    // --- Слой провайдеров ---
    if (showProviders) {
      const providerCluster = L.markerClusterGroup({
        iconCreateFunction: function(cluster) {
          const count = cluster.getChildCount();
          let c = ' marker-cluster-';
          if (count < 10) {
            c += 'small';
          } else if (count < 100) {
            c += 'medium';
          } else {
            c += 'large';
          }
          return new L.DivIcon({
            html: '<div><span>' + count + '</span></div>',
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
        providerCluster.addLayer(marker);
      });
      providersMarkersRef.current = providerCluster;
      map.addLayer(providerCluster);
    }

    // --- Слой бизнес-центров ---
    let filteredBusinessCenters = businessCenters;
    if (filterType === 'kt') {
      filteredBusinessCenters = businessCenters.filter(bc =>
        bc.companies.some(c => c.is_kt_client)
      );
    } else if (filterType === 'non-kt') {
      filteredBusinessCenters = businessCenters.filter(bc =>
        !bc.companies.some(c => c.is_kt_client)
      );
    }

    // Подготовка данных для тепловой карты
    const heatmapData = [];
    filteredBusinessCenters.forEach(bc => {
      const ktClientsCount = bc.companies.filter(c => c.is_kt_client).length;
      const totalRevenue = bc.companies.reduce((sum, c) => sum + (c.accruals || 0), 0);
      const intensity = Math.max(ktClientsCount * 0.1, totalRevenue / 1000000);
      heatmapData.push([bc.latitude, bc.longitude, intensity]);
    });

    // Добавляем тепловую карту
    if (showHeatmap) {
      heatmapRef.current = L.heatLayer(heatmapData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.0: 'blue',
          0.2: 'cyan',
          0.4: 'lime',
          0.6: 'yellow',
          0.8: 'orange',
          1.0: 'red'
        }
      }).addTo(map);
    }

    // Добавляем маркеры бизнес-центров (кластеры или по-отдельности)
    if (showClusters) {
      const bcCluster = L.markerClusterGroup({
        iconCreateFunction: function(cluster) {
          const count = cluster.getChildCount();
          let c = ' marker-cluster-';
          if (count < 10) {
            c += 'small';
          } else if (count < 100) {
            c += 'medium';
          } else {
            c += 'large';
          }
          return new L.DivIcon({
            html: '<div><span>' + count + '</span></div>',
            className: 'marker-cluster' + c,
            iconSize: new L.Point(40, 40)
          });
        }
      });

      filteredBusinessCenters.forEach(bc => {
        const marker = L.marker([bc.latitude, bc.longitude], { icon: getIconForBusinessCenter(bc) });
        marker.bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language));
        bcCluster.addLayer(marker);
      });
      markersRef.current = bcCluster;
      map.addLayer(bcCluster);
    } else {
      filteredBusinessCenters.forEach(bc => {
        const marker = L.marker([bc.latitude, bc.longitude], { icon: getIconForBusinessCenter(bc) });
        marker.bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language));
        marker.addTo(map);
      });
    }

    return () => {
      if (markersRef.current) {
        map.removeLayer(markersRef.current);
        markersRef.current = null;
      }
      if (heatmapRef.current) {
        map.removeLayer(heatmapRef.current);
        heatmapRef.current = null;
      }
      if (providersMarkersRef.current) {
        map.removeLayer(providersMarkersRef.current);
        providersMarkersRef.current = null;
      }
    };
  }, [map, businessCenters, providers, showHeatmap, showClusters, filterType, onOrganizationClick, onBusinessCenterClick, onProviderClick, language, showProviders]);

  // ... остальной код MapInteractions и компоненты OrganizationCard, BusinessCenterCard, ProviderCard, App и т.д. остаются без изменений ...
}

export default App;
