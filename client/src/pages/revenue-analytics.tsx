import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState, CardLoadingSkeleton } from '@/components/ui/loading-state';
import { ErrorDisplay } from '@/components/ui/error-display';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  FileText,
  Download,
  Filter
} from 'lucide-react';

export default function RevenueAnalytics() {
  const [timeRange, setTimeRange] = useState('30');
  const [reportType, setReportType] = useState('summary');

  const { data: comprehensiveData, isLoading } = useQuery({
    queryKey: ['/api/analytics/comprehensive', timeRange],
    enabled: true
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['/api/revenue-analytics'],
    enabled: true
  });

  const organization = comprehensiveData?.organization;
  const revenue = comprehensiveData?.revenue;
  const patients = comprehensiveData?.patients;
  const services = comprehensiveData?.services;
  const trends = comprehensiveData?.trends;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const exportReport = () => {
    if (!comprehensiveData) return;
    
    const { organization, revenue, patients, services } = comprehensiveData;
    
    // Create comprehensive CSV content with real data
    const csvContent = `${organization?.name || 'Healthcare Organization'} - Revenue Analytics Report\n` +
      `Report Period: ${comprehensiveData.period?.startDate} to ${comprehensiveData.period?.endDate}\n\n` +
      `FINANCIAL SUMMARY\n` +
      `Total Revenue,₦${revenue?.total?.toLocaleString() || 0}\n` +
      `Outstanding Receivables,₦${revenue?.outstanding?.toLocaleString() || 0}\n` +
      `Collection Rate,${revenue?.collectionRate || 0}%\n` +
      `Payment Transactions,${revenue?.paymentCount || 0}\n\n` +
      `PATIENT ANALYTICS\n` +
      `Total Patients Billed,${patients?.total || 0}\n` +
      `Average Revenue per Patient,₦${patients?.averageRevenuePerPatient?.toLocaleString() || 0}\n\n` +
      `TOP PAYING PATIENTS\n` +
      `Patient Name,Total Spent,Invoice Count,Last Visit\n` +
      (patients?.topPaying || []).map((patient: any) => 
        `${patient.patientName},₦${patient.totalSpent?.toLocaleString()},${patient.invoiceCount},${patient.lastVisit}`
      ).join('\n') + '\n\n' +
      `SERVICE REVENUE BREAKDOWN\n` +
      `Service Type,Total Revenue,Transaction Count,Average Price\n` +
      (services?.breakdown || []).map((service: any) => 
        `${service.serviceType},₦${service.totalRevenue?.toLocaleString()},${service.transactionCount},₦${service.averagePrice?.toLocaleString()}`
      ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${organization?.name || 'healthcare'}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
          <LoadingState text="Loading analytics..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <CardLoadingSkeleton />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <CardLoadingSkeleton />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <CardLoadingSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || comprehensiveError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
        </div>
        <ErrorDisplay
          title="Failed to Load Analytics"
          message={error?.message || comprehensiveError?.message || "Unable to fetch revenue data"}
          onRetry={() => {
            refetch();
            refetchComprehensive();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue & Billing Analytics</h1>
          <p className="text-gray-600">Comprehensive financial insights and reporting</p>
        </div>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Organization Header */}
      {organization && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{organization.name}</h2>
              <p className="text-gray-600 capitalize">{organization.type} Organization</p>
              <p className="text-sm text-gray-500">
                Period: {comprehensiveData?.period?.startDate} to {comprehensiveData?.period?.endDate}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">₦{revenue?.total?.toLocaleString() || '0'}</div>
              <div className="text-sm text-gray-500">Total Revenue</div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{revenue?.total?.toLocaleString() || '0'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-blue-600">{revenue?.paymentCount || 0} payments</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-blue-600">{patients?.total || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-500">
                ₦{patients?.averageRevenuePerPatient?.toLocaleString() || '0'} avg/patient
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {revenue?.collectionRate || 0}%
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-500">Payment efficiency</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding Bills</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₦{revenue?.outstanding?.toLocaleString() || '0'}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-500">{revenue?.outstandingCount || 0} invoices</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`₦${value?.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trends?.paymentMethods?.map((method: any) => ({
                    name: method.method,
                    value: method.total,
                    percentage: ((method.total / revenue?.total) * 100).toFixed(1)
                  })) || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }: any) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(trends?.paymentMethods || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₦${value?.toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Service Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Service Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={services?.breakdown || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="serviceType" />
              <YAxis />
              <Tooltip formatter={(value) => [`₦${value?.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="totalRevenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Paying Patients */}
      <Card>
        <CardHeader>
          <CardTitle>Top Paying Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Patient Name</th>
                  <th className="text-center p-4">Phone</th>
                  <th className="text-right p-4">Total Spent</th>
                  <th className="text-right p-4">Invoices</th>
                  <th className="text-right p-4">Avg Invoice</th>
                </tr>
              </thead>
              <tbody>
                {(patients?.topPaying || []).map((patient: any, index: number) => (
                  <tr key={patient.patientId} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{patient.patientName}</td>
                    <td className="p-4 text-center text-sm text-gray-600">{patient.phone}</td>
                    <td className="p-4 text-right font-semibold text-green-600">
                      ₦{patient.totalSpent?.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-right">
                      <Badge variant="outline">{patient.invoiceCount}</Badge>
                    </td>
                    <td className="p-4 text-right">₦{patient.averageInvoiceValue?.toLocaleString() || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Service Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Revenue Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Service Type</th>
                  <th className="text-right p-4">Total Revenue</th>
                  <th className="text-right p-4">Transactions</th>
                  <th className="text-right p-4">Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {(services?.breakdown || []).map((service: any, index: number) => (
                  <tr key={service.serviceType} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{service.serviceType}</td>
                    <td className="p-4 text-right font-semibold text-green-600">
                      ₦{service.totalRevenue?.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-right">
                      <Badge variant="outline">{service.transactionCount}</Badge>
                    </td>
                    <td className="p-4 text-right">₦{service.averagePrice?.toLocaleString() || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}