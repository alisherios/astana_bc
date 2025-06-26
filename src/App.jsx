import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.heat';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Map, BarChart3, Square, Layers, TrendingUp, Building, Users } from 'lucide-react';
import AnalyticsPage from './components/AnalyticsPage';
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

function Navigation() {
  const location = useLocation();
  
  return (
    <div className="bg-white shadow-sm border-b p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Карта Бизнес-Центров Астаны
          </h1>
          <p className="text-gray-600 mt-1">
            Интерактивная карта с информацией о компаниях и услугах Казахтелеком
          </p>
        </div>
        
        <div className="flex gap-2">
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
        </div>
      </div>
    </div>
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
  setFilterType
}) {
  return (
    <div className="map-controls">
      <div className="filter-controls" style={{ marginBottom: '10px' }}>
        <Button
          onClick={() => setFilterType('all')}
          variant={filterType === 'all' ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Все
        </Button>
        
        <Button
          onClick={() => setFilterType('kt')}
          variant={filterType === 'kt' ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Building className="w-4 h-4" />
          КТ
        </Button>
        
        <Button
          onClick={() => setFilterType('non-kt')}
          variant={filterType === 'non-kt' ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Building className="w-4 h-4" />
          не КТ
        </Button>
      </div>
      
      <Button
        onClick={() => setShowHeatmap(!showHeatmap)}
        variant={showHeatmap ? "default" : "outline"}
        className="flex items-center gap-2"
      >
        <Layers className="w-4 h-4" />
        {showHeatmap ? 'Скрыть тепловую карту' : 'Показать тепловую карту'}
      </Button>
      
      <Button
        onClick={() => setShowClusters(!showClusters)}
        variant={showClusters ? "default" : "outline"}
        className="flex items-center gap-2"
      >
        <Building className="w-4 h-4" />
        {showClusters ? 'Отдельные маркеры' : 'Кластеризация'}
      </Button>
      
      <Button
        onClick={() => setZoneSelectionMode(!zoneSelectionMode)}
        variant={zoneSelectionMode ? "default" : "outline"}
        className="flex items-center gap-2"
      >
        <Square className="w-4 h-4" />
        {zoneSelectionMode ? 'Отменить выделение' : 'Выделить зону'}
      </Button>
      
      {selectedZone && (
        <Button
          onClick={clearZone}
          variant="destructive"
          className="flex items-center gap-2"
        >
          Очистить зону
        </Button>
      )}
    </div>
  );
}

// Component for zone statistics panel
function ZoneStatsPanel({ selectedZone, businessCenters }) {
  if (!selectedZone) return null;

  const { bounds } = selectedZone;
  const filteredBCs = businessCenters.filter(bc => {
    return bc.latitude >= bounds.south && 
           bc.latitude <= bounds.north && 
           bc.longitude >= bounds.west && 
           bc.longitude <= bounds.east;
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
          Статистика по зоне
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
  selectedZone,
  setSelectedZone,
  filterType,
  onOrganizationClick,
  onBusinessCenterClick
}) {
  const map = useMap();
  const markersRef = useRef(null);
  const heatmapRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Clear existing layers
    if (markersRef.current) {
      map.removeLayer(markersRef.current);
    }
    if (heatmapRef.current) {
      map.removeLayer(heatmapRef.current);
    }

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

    // Prepare heatmap data
    const heatmapData = [];
    filteredBusinessCenters.forEach(bc => {
      const ktClientsCount = bc.companies.filter(c => c.is_kt_client).length;
      const totalRevenue = bc.companies.reduce((sum, c) => sum + (c.accruals || 0), 0);
      const intensity = Math.max(ktClientsCount * 0.1, totalRevenue / 1000000);
      heatmapData.push([bc.latitude, bc.longitude, intensity]);
    });

    // Add heatmap layer
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

    // Add markers
    if (showClusters) {
      // Create marker cluster group
      markersRef.current = L.markerClusterGroup({
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
          c += '';

          return new L.DivIcon({
            html: '<div><span>' + count + '</span></div>',
            className: 'marker-cluster' + c,
            iconSize: new L.Point(40, 40)
          });
        }
      });

      filteredBusinessCenters.forEach(bc => {
        const marker = L.marker([bc.latitude, bc.longitude], {
          icon: defaultIcon
        });

        marker.bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick));
        markersRef.current.addLayer(marker);
      });

      map.addLayer(markersRef.current);
    } else {
      // Add individual markers
      filteredBusinessCenters.forEach(bc => {
        const marker = L.marker([bc.latitude, bc.longitude], {
          icon: defaultIcon
        });

        marker.bindPopup(renderCompanyPopup(bc, onOrganizationClick, onBusinessCenterClick));
        marker.addTo(map);
      });
    }

    return () => {
      if (markersRef.current) {
        map.removeLayer(markersRef.current);
      }
      if (heatmapRef.current) {
        map.removeLayer(heatmapRef.current);
      }
    };
  }, [map, businessCenters, showHeatmap, showClusters, filterType, onOrganizationClick, onBusinessCenterClick]);

  // Handle zone selection
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
      map.getContainer().style.cursor = '';
    };
  }, [map, zoneSelectionMode, setSelectedZone]);

  return null;
}

// Component for organization card modal
function OrganizationCard({ organization, isOpen, onClose }) {
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
            <strong style={{ color: '#374151' }}>БИН:</strong>
            <span style={{ marginLeft: '8px', color: '#6b7280' }}>{organization.bin}</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#374151' }}>Адрес:</strong>
            <span style={{ marginLeft: '8px', color: '#6b7280' }}>{organization.address}</span>
          </div>
          {organization.accruals > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#374151' }}>Начисления:</strong>
              <span style={{ marginLeft: '8px', color: '#059669', fontWeight: '600' }}>
                {organization.accruals.toLocaleString()} тг
              </span>
            </div>
          )}
        </div>

        {organization.is_kt_client && organization.services && organization.services.length > 0 && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
              Услуги Казахтелеком:
            </h3>
            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '12px' }}>
              {organization.services.map((service, index) => (
                <div key={index} style={{
                  padding: '8px 0',
                  borderBottom: index < organization.services.length - 1 ? '1px solid #e5e7eb' : 'none',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  {service}
                </div>
              ))}
            </div>
          </div>
        )}

        {organization.is_kt_client && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#dbeafe',
            borderRadius: '6px',
            border: '1px solid #93c5fd'
          }}>
            <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
              ✓ Клиент Казахтелеком
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function renderCompanyPopup(businessCenter, onOrganizationClick, onBusinessCenterClick) {
  const popupId = `popup-${businessCenter.business_center_name.replace(/\s+/g, '-').toLowerCase()}`;

  const companies = businessCenter.companies || [];
  const ktClientsCount = companies.filter(c => c.is_kt_client).length;
  const nonKtClientsCount = companies.length - ktClientsCount;

  window[`${popupId}-org-callback`] = onOrganizationClick;
  window[`${popupId}-bc-callback`] = onBusinessCenterClick;

  return `
    <div style="min-width: 300px; max-width: 400px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div>
          <h3 style="margin: 0; font-weight: bold; font-size: 16px;">
            ${businessCenter.business_center_name}
          </h3>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #4b5563;">
            Клиенты: <strong style="color: #2563eb;">КТ: ${ktClientsCount}</strong> | <strong style="color: #6b7280;">не КТ: ${nonKtClientsCount}</strong>
          </p>
        </div>
        <button onclick="window['${popupId}-bc-callback'](${JSON.stringify(businessCenter).replace(/"/g, '&quot;')}); return false;"
                style="background-color: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;"
                onmouseover="this.style.backgroundColor='#2563eb'"
                onmouseout="this.style.backgroundColor='#3b82f6'">
          Фильтр услуг
        </button>
      </div>
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
        <strong>Район:</strong> ${businessCenter.district}<br/>
        <strong>Назначение:</strong> ${businessCenter.building_purpose}
      </p>

      <div style="max-height: 300px; overflow-y: auto;">
        <h4 style="margin: 10px 0 5px 0; font-size: 14px; font-weight: bold;">
          Компании (${businessCenter.companies.length}):
        </h4>
        
        ${businessCenter.companies.map(company => `
          <div class="company-item" style="margin-bottom: 8px; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-weight: bold; font-size: 13px; flex: 1;">
                <a href="#" 
                   onclick="window['${popupId}-org-callback'](${JSON.stringify(company).replace(/"/g, '&quot;')}); return false;"
                   style="color: #3b82f6; text-decoration: none; cursor: pointer;"
                   onmouseover="this.style.textDecoration='underline'"
                   onmouseout="this.style.textDecoration='none'">
                  ${company.organization_name}
                </a>
              </div>
              <div style="margin-left: 10px;">
                ${company.is_kt_client ? 
                  '<span style="background-color: #3b82f6; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; font-weight: bold;">КТ</span>' : 
                  '<span style="background-color: #6b7280; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; font-weight: bold;">не КТ</span>'
                }
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}


function MapPage() {
  const [businessCenters, setBusinessCenters] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [zoneSelectionMode, setZoneSelectionMode] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [showOrganizationCard, setShowOrganizationCard] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [showServiceFilter, setShowServiceFilter] = useState(false);
  const [selectedBusinessCenter, setSelectedBusinessCenter] = useState(null);

  useEffect(() => {
    setBusinessCenters(data);
  }, []);

  const clearZone = () => {
    setSelectedZone(null);
    setZoneSelectionMode(false);
  };

  const handleOrganizationClick = (organization) => {
    setSelectedOrganization(organization);
    setShowOrganizationCard(true);
  };

  const closeOrganizationCard = () => {
    setShowOrganizationCard(false);
    setSelectedOrganization(null);
  };

  const handleBusinessCenterClick = (businessCenter) => {
    setSelectedBusinessCenter(businessCenter);
    setShowServiceFilter(true);
    // Get all unique services from this business center's KT clients
    const allServices = [];
    businessCenter.companies.forEach(company => {
      if (company.is_kt_client && company.services) {
        allServices.push(...company.services);
      }
    });
    const uniqueServices = [...new Set(allServices)];
    setSelectedServices(uniqueServices);
  };

  const closeServiceFilter = () => {
    setShowServiceFilter(false);
    setSelectedBusinessCenter(null);
    setSelectedServices([]);
  };

  const toggleServiceSelection = (service) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  return (
    <div className="relative">
      <MapContainer
        center={[51.1694, 71.4491]} // Astana coordinates
        zoom={12}
        style={{ height: 'calc(100vh - 100px)', width: '100%' }}
        className={zoneSelectionMode ? 'zone-selection-active' : ''}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapInteractions
          businessCenters={businessCenters}
          showHeatmap={showHeatmap}
          showClusters={showClusters}
          zoneSelectionMode={zoneSelectionMode}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          filterType={filterType}
          onOrganizationClick={handleOrganizationClick}
          onBusinessCenterClick={handleBusinessCenterClick}
        />
        
        {selectedZone && selectedZone.rectangle && (
          <Rectangle
            bounds={[
              [selectedZone.bounds.south, selectedZone.bounds.west],
              [selectedZone.bounds.north, selectedZone.bounds.east]
            ]}
            pathOptions={{
              color: '#3b82f6',
              weight: 2,
              fillOpacity: 0.1
            }}
          />
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
      />
      
      <ZoneStatsPanel
        selectedZone={selectedZone}
        businessCenters={businessCenters}
      />

      <OrganizationCard
        organization={selectedOrganization}
        isOpen={showOrganizationCard}
        onClose={closeOrganizationCard}
      />

      {/* Service Filter Modal */}
      {showServiceFilter && selectedBusinessCenter && (
        <div style={{
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
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                Услуги в {selectedBusinessCenter.business_center_name}
              </h2>
              <button 
                onClick={closeServiceFilter}
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
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                Выберите услуги для фильтрации организаций:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px' }}>
                {(() => {
                  const allServices = [];
                  selectedBusinessCenter.companies.forEach(company => {
                    if (company.is_kt_client && company.services) {
                      allServices.push(...company.services);
                    }
                  });
                  const uniqueServices = [...new Set(allServices)];
                  
                  return uniqueServices.map((service, index) => (
                    `<label key="${index}" style="display: flex; align-items: center; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer; ${selectedServices.includes(service) ? 'background-color: #eff6ff; border-color: #3b82f6;' : ''}">
                      <input 
                        type="checkbox" 
                        ${selectedServices.includes(service) ? 'checked' : ''}
                        onchange="toggleServiceSelection('${service.replace(/'/g, "\\'")}')"
                        style="margin-right: 8px;"
                      />
                      <span style="font-size: 14px; color: #374151;">${service}</span>
                    </label>`
                  )).join('');
                })()}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={closeServiceFilter}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
              <button 
                onClick={() => {
                  // Apply filter logic here
                  closeServiceFilter();
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Применить фильтр
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="w-full h-screen">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

