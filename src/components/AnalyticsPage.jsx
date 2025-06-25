import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  ComposedChart, Line
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Building, Users, MapPin, TrendingUp, Download } from 'lucide-react';
import data from '../assets/data.json';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function AnalyticsPage() {
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedBuildingType, setSelectedBuildingType] = useState('all');

  const analytics = useMemo(() => {
    let filteredData = data;
    if (selectedDistrict !== 'all') {
      filteredData = filteredData.filter(bc => bc.district === selectedDistrict);
    }
    if (selectedBuildingType !== 'all') {
      filteredData = filteredData.filter(bc => bc.building_purpose === selectedBuildingType);
    }

    const totalBusinessCenters = filteredData.length;
    const totalCompanies = filteredData.reduce((sum, bc) => sum + bc.companies.length, 0);
    const ktClients = filteredData.reduce((sum, bc) => sum + bc.companies.filter(c => c.is_kt_client).length, 0);
    const totalRevenue = filteredData.reduce((sum, bc) => sum + bc.companies.reduce((s, c) => s + (c.accruals || 0), 0), 0);

    const districtStats = {};
    filteredData.forEach(bc => {
      if (!districtStats[bc.district]) {
        districtStats[bc.district] = { businessCenters: 0, companies: 0, ktClients: 0, revenue: 0 };
      }
      districtStats[bc.district].businessCenters++;
      districtStats[bc.district].companies += bc.companies.length;
      districtStats[bc.district].ktClients += bc.companies.filter(c => c.is_kt_client).length;
      districtStats[bc.district].revenue += bc.companies.reduce((sum, c) => sum + (c.accruals || 0), 0);
    });
    const districtData = Object.entries(districtStats).map(([district, stats]) => ({ district, ...stats }));

    const buildingTypeStats = {};
    filteredData.forEach(bc => {
      if (!buildingTypeStats[bc.building_purpose]) {
        buildingTypeStats[bc.building_purpose] = { count: 0, companies: 0, ktClients: 0 };
      }
      buildingTypeStats[bc.building_purpose].count++;
      buildingTypeStats[bc.building_purpose].companies += bc.companies.length;
      buildingTypeStats[bc.building_purpose].ktClients += bc.companies.filter(c => c.is_kt_client).length;
    });
    const buildingTypeData = Object.entries(buildingTypeStats).map(([type, stats]) => ({ type, ...stats }));

    const topBusinessCenters = filteredData
      .map(bc => ({
        name: bc.business_center_name,
        companies: bc.companies.length,
        ktClients: bc.companies.filter(c => c.is_kt_client).length,
        revenue: bc.companies.reduce((sum, c) => sum + (c.accruals || 0), 0)
      }))
      .sort((a, b) => b.companies - a.companies)
      .slice(0, 10);

    const allKtClients = [];
    filteredData.forEach(bc => {
      bc.companies.forEach(company => {
        if (company.is_kt_client) {
          allKtClients.push({
            name: company.organization_name,
            revenue: company.accruals || 0,
            services: company.services.length,
            businessCenter: bc.business_center_name
          });
        }
      });
    });
    const topKtClients = allKtClients.sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    return {
      totalBusinessCenters,
      totalCompanies,
      ktClients,
      totalRevenue,
      districtData,
      buildingTypeData,
      topBusinessCenters,
      topKtClients
    };
  }, [selectedDistrict, selectedBuildingType]);

  const serviceStats = useMemo(() => {
    const stats = {};
    data.forEach(bc => {
      bc.companies.forEach(company => {
        company.services.forEach(service => {
          if (!stats[service.name]) stats[service.name] = { revenue: 0, count: 0 };
          stats[service.name].revenue += service.revenue || 0;
          stats[service.name].count += 1;
        });
      });
    });
    return Object.entries(stats).map(([name, values]) => ({ name, ...values }));
  }, []);

  const top5Services = useMemo(() => {
    return [...serviceStats]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [serviceStats]);

  const bcStats = useMemo(() => {
    return data.map(bc => ({
      name: bc.business_center_name,
      revenue: bc.companies.reduce((sum, c) => {
        return sum + (c.services?.reduce((s, svc) => s + (svc.revenue || 0), 0) || 0);
      }, 0)
    }));
  }, []);

  // ... Возвращаем JSX (оставьте существующий return, просто вставьте новые секции ниже в нужное место)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ... ВАШИ СУЩЕСТВУЮЩИЕ КОМПОНЕНТЫ */}

        {/* 🔽 НОВЫЕ ГРАФИКИ */}

        <section>
          <h2 className="text-xl font-semibold mb-2">Выручка по всем услугам</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={serviceStats}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar dataKey="revenue" name="₸ выручка" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Топ-5 услуг по выручке (доля)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={top5Services}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {top5Services.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <Tooltip formatter={v => v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Выручка по бизнес-центрам</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bcStats}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar dataKey="revenue" name="₸ выручка" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Количество vs выручка услуг</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={serviceStats}>
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={v => v.toLocaleString()} />
              <Bar yAxisId="left" dataKey="count" name="Кол-во" />
              <Line yAxisId="right" dataKey="revenue" name="₸ выручка" stroke="#ff7300" />
            </ComposedChart>
          </ResponsiveContainer>
        </section>

      </div>
    </div>
  );
}

export default AnalyticsPage;
