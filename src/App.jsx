import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Rectangle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Map, BarChart3, Square, Layers, TrendingUp, Building, Users, Languages, Info, MousePointer, Trash2 } from 'lucide-react';
// import AnalyticsPage from './components/AnalyticsPage';
// import { useTranslation } from './translations';
import './App.css';
import data from './assets/data.json';

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

// Custom icon for polygon points
const polygonPointIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [15, 25],
  iconAnchor: [7, 25],
  popupAnchor: [1, -20],
  shadowSize: [25, 25]
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

// Function to check if a point is inside a polygon
function isPointInPolygon(point, polygon) {
  const x = point.lat;
  const y = point.lng;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

function Navigation({ language, setLanguage }) {
  const location = useLocation();
  const { t } = useTranslation(language);
  
  return (
    <div className="bg-white shadow-sm border-b p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Карта Бизнес-Центров Астаны
            </h1>
            <p className="text-gray-600 mt-1">
              Интерактивная карта с информацией о компаниях и услугах Казахтелеком
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
              Карта
            </Button>
          </Link>
          <Link to="/analytics">
            <Button 
              variant={location.pathname === '/analytics' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Аналитика
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
function MapLegend({ language }) {
  return (
    <Card className="map-legend absolute bottom-4 left-4 z-[1000]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="w-4 h-4" />
          Легенда
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Обычные БЦ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
          <span className="text-xs text-gray-600">БЦ с проникновением &lt; 30%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Точки зоны</span>
        </div>
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
  polygonSelectionMode,
  setPolygonSelectionMode,
  selectedZone,
  clearZone,
  polygonPoints,
  clearPolygon,
  filterType,
  setFilterType,
  language
}) {
  return (
    <div className="map-controls absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg space-y-2">
      <div className="filter-controls space-y-2">
        <h3 className="text-sm font-semibold">Фильтры</h3>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => setFilterType('all')}
            variant={filterType === 'all' ? "default" : "outline"}
            className="flex items-center gap-2 text-xs"
            size="sm"
          >
            <Users className="w-3 h-3" />
            Все
          </Button>
          
          <Button
            onClick={() => setFilterType('kt')}
            variant={filterType === 'kt' ? "default" : "outline"}
            className="flex items-center gap-2 text-xs"
            size="sm"
          >
            <Building className="w-3 h-3" />
            не КТ
          </Button>
          
          <Button
            onClick={() => setFilterType('non-kt')}
            variant={filterType === 'non-kt' ? "default" : "outline"}
            className="flex items-center gap-2 text-xs"
            size="sm"
          >
            <Building className="w-3 h-3" />
            КТ клиенты
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Отображение</h3>
        <Button
          onClick={() => setShowHeatmap(!showHeatmap)}
          variant={showHeatmap ? "default" : "outline"}
          className="flex items-center gap-2 text-xs w-full"
          size="sm"
        >
          <Layers className="w-3 h-3" />
          {showHeatmap ? 'Скрыть тепловую карту' : 'Показать тепловую карту'}
        </Button>
        
        <Button
          onClick={() => setShowClusters(!showClusters)}
          variant={showClusters ? "default" : "outline"}
          className="flex items-center gap-2 text-xs w-full"
          size="sm"
        >
          <Building className="w-3 h-3" />
          {showClusters ? 'Отдельные маркеры' : 'Кластеризация'}
        </Button>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Выбор зоны</h3>
        <Button
          onClick={() => {
            setZoneSelectionMode(!zoneSelectionMode);
            if (polygonSelectionMode) setPolygonSelectionMode(false);
          }}
          variant={zoneSelectionMode ? "default" : "outline"}
          className="flex items-center gap-2 text-xs w-full"
          size="sm"
        >
          <Square className="w-3 h-3" />
          {zoneSelectionMode ? 'Отменить выбор' : 'Прямоугольная зона'}
        </Button>

        <Button
          onClick={() => {
            setPolygonSelectionMode(!polygonSelectionMode);
            if (zoneSelectionMode) setZoneSelectionMode(false);
          }}
          variant={polygonSelectionMode ? "default" : "outline"}
          className="flex items-center gap-2 text-xs w-full"
          size="sm"
        >
          <MousePointer className="w-3 h-3" />
          {polygonSelectionMode ? 'Завершить зону' : 'Отметить зону'}
        </Button>
        
        {selectedZone && (
          <Button
            onClick={clearZone}
            variant="destructive"
            className="flex items-center gap-2 text-xs w-full"
            size="sm"
          >
            <Trash2 className="w-3 h-3" />
            Очистить прямоугольник
          </Button>
        )}

        {polygonPoints.length > 0 && (
          <Button
            onClick={clearPolygon}
            variant="destructive"
            className="flex items-center gap-2 text-xs w-full"
            size="sm"
          >
            <Trash2 className="w-3 h-3" />
            Очистить зону ({polygonPoints.length})
          </Button>
        )}
      </div>
    </div>
  );
}

// Component for zone statistics panel
function ZoneStatsPanel({ selectedZone, polygonPoints, businessCenters, language }) {
  if (!selectedZone && polygonPoints.length === 0) return null;

  let filteredBCs = [];

  if (selectedZone) {
    const { bounds } = selectedZone;
    filteredBCs = businessCenters.filter(bc => {
      return bc.latitude >= bounds.south && 
             bc.latitude <= bounds.north && 
             bc.longitude >= bounds.west && 
             bc.longitude <= bounds.east;
    });
  } else if (polygonPoints.length >= 3) {
    filteredBCs = businessCenters.filter(bc => {
      const point = { lat: bc.latitude, lng: bc.longitude };
      return isPointInPolygon(point, polygonPoints);
    });
  }

  const totalCompanies = filteredBCs.reduce((sum, bc) => sum + bc.companies.length, 0);
  const ktClients = filteredBCs.reduce((sum, bc) => 
    sum + bc.companies.filter(company => company.is_kt_client).length, 0
  );
  const totalRevenue = filteredBCs.reduce((sum, bc) => 
    sum + bc.companies.reduce((companySum, company) => companySum + (company.accruals || 0), 0), 0
  );

  const zoneType = selectedZone ? 'прямоугольной' : 'полигональной';

  return (
    <Card className="zone-stats-panel absolute top-4 left-4 z-[1000] w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Статистика по {zoneType} зоне
        </CardTitle>
        <CardDescription>
          Данные по выделенной области
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Бизнес-центров:</span>
          <Badge variant="secondary">{filteredBCs.length}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Компаний:</span>
          <Badge variant="secondary">{totalCompanies}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">КТ клиентов:</span>
          <Badge variant="default" className="bg-blue-600">{ktClients}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Общий доход:</span>
          <Badge variant="outline">{totalRevenue.toLocaleString()} тг</Badge>
        </div>
        {polygonPoints.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Точек зоны:</span>
            <Badge variant="outline">{polygonPoints.length}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for handling map interactions
function MapInteractions({ 
  businessCenters, 
  showHeatmap, 
  showClusters,
  zoneSelectionMode,
  polygonSelectionMode,
  selectedZone,
  setSelectedZone,
  polygonPoints,
  setPolygonPoints,
  filterType,
  onOrganizationClick,
  onBusinessCenterClick,
  language
}) {
  const map = useMap();
  const markersRef = useRef([]);
  const polygonMarkersRef = useRef([]);
  const polygonRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    // Filter business centers based on filterType
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

    // Add individual markers
    filteredBusinessCenters.forEach(bc => {
      const marker = L.marker([bc.latitude, bc.longitude], {
        icon: getIconForBusinessCenter(bc)
      });

      marker.bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language));
      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
    };
  }, [map, businessCenters, showHeatmap, showClusters, filterType, onOrganizationClick, onBusinessCenterClick, language]);

  // Handle polygon points visualization
  useEffect(() => {
    if (!map) return;

    // Clear existing polygon markers
    polygonMarkersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    polygonMarkersRef.current = [];

    // Clear existing polygon
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    // Add polygon point markers
    polygonPoints.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: polygonPointIcon
      });
      
      marker.bindPopup(`Точка ${index + 1}`);
      marker.addTo(map);
      polygonMarkersRef.current.push(marker);
    });

    // Draw polygon if we have at least 3 points
    if (polygonPoints.length >= 3) {
      const latLngs = polygonPoints.map(point => [point.lat, point.lng]);
      polygonRef.current = L.polygon(latLngs, {
        color: '#3b82f6',
        weight: 2,
        fillOpacity: 0.1
      }).addTo(map);
    }

    return () => {
      polygonMarkersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      if (polygonRef.current) {
        map.removeLayer(polygonRef.current);
      }
    };
  }, [map, polygonPoints]);

  // Handle polygon selection
  useEffect(() => {
    if (!map) return;

    const handleMapClick = (e) => {
      if (!polygonSelectionMode) return;
      
      const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPolygonPoints(prev => [...prev, newPoint]);
    };

    if (polygonSelectionMode) {
      map.on('click', handleMapClick);
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.off('click', handleMapClick);
      map.getContainer().style.cursor = '';
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, polygonSelectionMode, setPolygonPoints]);

  // Handle rectangle zone selection
  useEffect(() => {
    if (!map) return;

    let isDrawing = false;
    let startLatLng = null;
    let rectangle = null;

    const handleMouseDown = (e) => {
      if (!zoneSelectionMode) return;
      isDrawing = true;
      startLatLng = e.latlng;
    };

    const handleMouseMove = (e) => {
      if (!zoneSelectionMode || !isDrawing || !startLatLng) return;
      
      if (rectangle) {
        map.removeLayer(rectangle);
      }
      
      const bounds = L.latLngBounds(startLatLng, e.latlng);
      rectangle = L.rectangle(bounds, {
        color: '#3b82f6',
        weight: 2,
        fillOpacity: 0.1
      }).addTo(map);
    };

    const handleMouseUp = (e) => {
      if (!zoneSelectionMode || !isDrawing || !startLatLng) return;
      
      isDrawing = false;
      const bounds = L.latLngBounds(startLatLng, e.latlng);
      
      setSelectedZone({
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        },
        rectangle: rectangle
      });
      
      startLatLng = null;
    };

    if (zoneSelectionMode) {
      map.on('mousedown', handleMouseDown);
      map.on('mousemove', handleMouseMove);
      map.on('mouseup', handleMouseUp);
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      if (rectangle) {
        map.removeLayer(rectangle);
      }
      setSelectedZone(null);
      map.getContainer().style.cursor = '';
    }

    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
    };
  }, [map, zoneSelectionMode, setSelectedZone]);

  return null;
}

// Function to render company popup
function renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick, language) {
  const ktClients = bc.companies.filter(c => c.is_kt_client).length;
  const totalCompanies = bc.companies.length;
  const penetrationRate = getPenetrationRate(bc);
  
  return `
    <div style="min-width: 200px;">
      <h3 style="margin: 0 0 10px 0; font-weight: bold;">${bc.name}</h3>
      <p style="margin: 5px 0;"><strong>Адрес:</strong> ${bc.address}</p>
      <p style="margin: 5px 0;"><strong>Компаний:</strong> ${totalCompanies}</p>
      <p style="margin: 5px 0;"><strong>КТ клиентов:</strong> ${ktClients}</p>
      <p style="margin: 5px 0;"><strong>Проникновение:</strong> ${penetrationRate.toFixed(1)}%</p>
      <button onclick="window.showBusinessCenterDetails('${bc.id}')" 
              style="margin-top: 10px; padding: 5px 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Подробнее
      </button>
    </div>
  `;
}

// Mock translation hook
function useTranslation(language) {
  return {
    t: (key) => key
  };
}

// Mock analytics page
function AnalyticsPage({ language }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Аналитика</h1>
      <p>Страница аналитики в разработке</p>
    </div>
  );
}

// Main App component
function App() {
  const [language, setLanguage] = useState('ru');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [zoneSelectionMode, setZoneSelectionMode] = useState(false);
  const [polygonSelectionMode, setPolygonSelectionMode] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [showOrganizationCard, setShowOrganizationCard] = useState(false);

  // Mock data for demonstration
  const businessCenters = [
    {
      id: '1',
      name: 'Бизнес-центр "Алматы"',
      address: 'ул. Абая, 150',
      latitude: 51.1694,
      longitude: 71.4491,
      companies: [
        { id: '1', name: 'ТОО "Компания 1"', is_kt_client: true, accruals: 500000 },
        { id: '2', name: 'ТОО "Компания 2"', is_kt_client: false, accruals: 300000 },
        { id: '3', name: 'ТОО "Компания 3"', is_kt_client: true, accruals: 750000 }
      ]
    },
    {
      id: '2',
      name: 'Бизнес-центр "Астана"',
      address: 'пр. Республики, 24',
      latitude: 51.1794,
      longitude: 71.4591,
      companies: [
        { id: '4', name: 'ТОО "Компания 4"', is_kt_client: false, accruals: 200000 },
        { id: '5', name: 'ТОО "Компания 5"', is_kt_client: true, accruals: 600000 }
      ]
    },
    {
      id: '3',
      name: 'Бизнес-центр "Нур-Султан"',
      address: 'ул. Кенесары, 40',
      latitude: 51.1594,
      longitude: 71.4391,
      companies: [
        { id: '6', name: 'ТОО "Компания 6"', is_kt_client: true, accruals: 450000 },
        { id: '7', name: 'ТОО "Компания 7"', is_kt_client: false, accruals: 350000 },
        { id: '8', name: 'ТОО "Компания 8"', is_kt_client: false, accruals: 250000 },
        { id: '9', name: 'ТОО "Компания 9"', is_kt_client: true, accruals: 800000 }
      ]
    }
  ];

  const handleOrganizationClick = (organization) => {
    setSelectedOrganization(organization);
    setShowOrganizationCard(true);
  };

  const handleBusinessCenterClick = (bcId) => {
    const bc = businessCenters.find(b => b.id === bcId);
    if (bc) {
      console.log('Business center details:', bc);
    }
  };

  const clearZone = () => {
    setSelectedZone(null);
    setZoneSelectionMode(false);
  };

  const clearPolygon = () => {
    setPolygonPoints([]);
    setPolygonSelectionMode(false);
  };

  // Global function for popup buttons
  useEffect(() => {
    window.showBusinessCenterDetails = handleBusinessCenterClick;
  }, []);

  return (
    <Router>
      <div className="App">
        <Navigation language={language} setLanguage={setLanguage} />
        
        <Routes>
          <Route path="/analytics" element={<AnalyticsPage language={language} />} />
          <Route path="/" element={
            <div className="map-container relative">
              <MapContainer
                center={[51.1694, 71.4491]} // Астана
                zoom={12}
                style={{ height: 'calc(100vh - 80px)', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <MapInteractions
                  businessCenters={businessCenters}
                  showHeatmap={showHeatmap}
                  showClusters={showClusters}
                  zoneSelectionMode={zoneSelectionMode}
                  polygonSelectionMode={polygonSelectionMode}
                  selectedZone={selectedZone}
                  setSelectedZone={setSelectedZone}
                  polygonPoints={polygonPoints}
                  setPolygonPoints={setPolygonPoints}
                  filterType={filterType}
                  onOrganizationClick={handleOrganizationClick}
                  onBusinessCenterClick={handleBusinessCenterClick}
                  language={language}
                />
              </MapContainer>
              
              <MapControls
                showHeatmap={showHeatmap}
                setShowHeatmap={setShowHeatmap}
                showClusters={showClusters}
                setShowClusters={setShowClusters}
                zoneSelectionMode={zoneSelectionMode}
                setZoneSelectionMode={setZoneSelectionMode}
                polygonSelectionMode={polygonSelectionMode}
                setPolygonSelectionMode={setPolygonSelectionMode}
                selectedZone={selectedZone}
                clearZone={clearZone}
                polygonPoints={polygonPoints}
                clearPolygon={clearPolygon}
                filterType={filterType}
                setFilterType={setFilterType}
                language={language}
              />
              
              <ZoneStatsPanel
                selectedZone={selectedZone}
                polygonPoints={polygonPoints}
                businessCenters={businessCenters}
                language={language}
              />
              
              <MapLegend language={language} />
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

