import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
    const ktClients = filteredData.reduce((sum, bc) => 
      sum + bc.companies.filter(company => company.is_kt_client).length, 0
    );
    const totalRevenue = filteredData.reduce((sum, bc) => 
      sum + bc.companies.reduce((companySum, company) => companySum + (company.accruals || 0), 0), 0
    );

    const districtStats = {};
    filteredData.forEach(bc => {
      if (!districtStats[bc.district]) {
        districtStats[bc.district] = { 
          businessCenters: 0, 
          companies: 0, 
          ktClients: 0,
          revenue: 0
        };
      }
      districtStats[bc.district].businessCenters++;
      districtStats[bc.district].companies += bc.companies.length;
      districtStats[bc.district].ktClients += bc.companies.filter(c => c.is_kt_client).length;
      districtStats[bc.district].revenue += bc.companies.reduce((sum, c) => sum + (c.accruals || 0), 0);
    });

    const districtData = Object.entries(districtStats).map(([district, stats]) => ({
      district,
      ...stats
    }));

    const buildingTypeStats = {};
    filteredData.forEach(bc => {
      if (!buildingTypeStats[bc.building_purpose]) {
        buildingTypeStats[bc.building_purpose] = { 
          count: 0, 
          companies: 0,
          ktClients: 0
        };
      }
      buildingTypeStats[bc.building_purpose].count++;
      buildingTypeStats[bc.building_purpose].companies += bc.companies.length;
      buildingTypeStats[bc.building_purpose].ktClients += bc.companies.filter(c => c.is_kt_client).length;
    });

    const buildingTypeData = Object.entries(buildingTypeStats).map(([type, stats]) => ({
      type,
      ...stats
    }));

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

    const topKtClients = allKtClients
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const lowPenetrationBCs = filteredData
      .map(bc => {
        const total = bc.companies.length;
        const kt = bc.companies.filter(c => c.is_kt_client).length;
        const percent = total > 0 ? (kt / total) * 100 : 0;
        return {
          name: bc.business_center_name,
          district: bc.district,
          totalCompanies: total,
          ktClients: kt,
          penetration: percent.toFixed(1)
        };
      })
      .filter(bc => bc.ktClients > 0 && bc.ktClients < bc.totalCompanies)
      .sort((a, b) => a.penetration - b.penetration)
      .slice(0, 10);

    return {
      totalBusinessCenters,
      totalCompanies,
      ktClients,
      totalRevenue,
      districtData,
      buildingTypeData,
      topBusinessCenters,
      topKtClients,
      lowPenetrationBCs,
    };
  }, [selectedDistrict, selectedBuildingType]);

  // остальной код не изменяется

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ...заголовки, фильтры, метрики, графики... */}

        {/* БЦ с низким проникновением */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>БЦ с низким проникновением</CardTitle>
              <CardDescription>Есть КТ, но большинство — не наши</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.lowPenetrationBCs.map((bc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="font-medium">{bc.name}</div>
                      <div className="text-sm text-gray-600">
                        {bc.district} • {bc.ktClients} из {bc.totalCompanies} компаний — {bc.penetration}% КТ
                      </div>
                    </div>
                    <Badge variant="outline">
                      {bc.penetration}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
