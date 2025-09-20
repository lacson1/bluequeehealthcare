import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Download,
  FileText,
  Calendar,
  Users,
  Shield,
  CheckCircle,
  AlertTriangle,
  Filter,
  Database,
  FileSpreadsheet
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ComplianceReport {
  id: string;
  title: string;
  description: string;
  category: 'regulatory' | 'clinical' | 'financial' | 'operational';
  frequency: 'monthly' | 'quarterly' | 'annual' | 'on-demand';
  lastGenerated?: string;
  format: 'pdf' | 'excel' | 'csv' | 'xml';
  requiredFields: string[];
}

export default function ExportCompliance() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  
  const { user } = useAuth();
  const { toast } = useToast();

  const complianceReports: ComplianceReport[] = [
    {
      id: 'patient-registry',
      title: 'Patient Registry Report',
      description: 'Comprehensive patient database export for regulatory compliance',
      category: 'regulatory',
      frequency: 'quarterly',
      format: 'excel',
      requiredFields: ['Patient ID', 'Demographics', 'Medical History', 'Treatments', 'Outcomes']
    },
    {
      id: 'clinical-audit',
      title: 'Clinical Audit Trail',
      description: 'Complete audit log of all clinical activities and decisions',
      category: 'clinical',
      frequency: 'monthly',
      format: 'pdf',
      requiredFields: ['User Actions', 'Patient Interactions', 'Medication Changes', 'Diagnosis Updates']
    },
    {
      id: 'financial-summary',
      title: 'Financial Summary Report',
      description: 'Revenue, billing, and payment records for accounting compliance',
      category: 'financial',
      frequency: 'monthly',
      format: 'excel',
      requiredFields: ['Revenue Data', 'Payment Methods', 'Outstanding Bills', 'Service Breakdown']
    },
    {
      id: 'medication-inventory',
      title: 'Medication Inventory Report',
      description: 'Drug stock levels, usage, and expiry tracking for pharmaceutical compliance',
      category: 'operational',
      frequency: 'monthly',
      format: 'csv',
      requiredFields: ['Stock Levels', 'Usage Statistics', 'Expiry Dates', 'Supplier Information']
    },
    {
      id: 'staff-activity',
      title: 'Staff Activity Report',
      description: 'Healthcare provider activity logs and productivity metrics',
      category: 'operational',
      frequency: 'quarterly',
      format: 'pdf',
      requiredFields: ['Login Records', 'Patient Consultations', 'Documentation Time', 'Training Records']
    },
    {
      id: 'infection-control',
      title: 'Infection Control Report',
      description: 'Disease surveillance and outbreak monitoring data',
      category: 'clinical',
      frequency: 'monthly',
      format: 'xml',
      requiredFields: ['Disease Cases', 'Treatment Outcomes', 'Vaccination Records', 'Quarantine Data']
    }
  ];

  const { data: auditData } = useQuery({
    queryKey: ['/api/audit-logs'],
    enabled: true
  });

  const { data: complianceStats } = useQuery({
    queryKey: ['/api/compliance/statistics'],
    enabled: true
  });

  const filteredReports = complianceReports.filter(report => 
    filterCategory === 'all' || report.category === filterCategory
  );

  const generateReport = async (reportId: string) => {
    setIsGenerating(true);
    
    try {
      const report = complianceReports.find(r => r.id === reportId);
      if (!report) return;

      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create download content based on report type
      let content = '';
      let filename = '';
      let mimeType = '';

      switch (report.format) {
        case 'csv':
          content = generateCSVContent(report);
          filename = `${reportId}-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        case 'excel':
          content = generateExcelContent(report);
          filename = `${reportId}-${new Date().toISOString().split('T')[0]}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'xml':
          content = generateXMLContent(report);
          filename = `${reportId}-${new Date().toISOString().split('T')[0]}.xml`;
          mimeType = 'application/xml';
          break;
        default:
          content = generatePDFContent(report);
          filename = `${reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
          mimeType = 'application/pdf';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: `${report.title} has been exported successfully.`,
      });

    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate compliance report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCSVContent = (report: ComplianceReport) => {
    const headers = report.requiredFields.join(',');
    const sampleData = [
      '001,John Doe,35,Hypertension,Amlodipine,Controlled',
      '002,Jane Smith,28,Diabetes,Metformin,Stable',
      '003,Mike Johnson,45,Asthma,Salbutamol,Improved'
    ];
    return `${headers}\n${sampleData.join('\n')}`;
  };

  const generateExcelContent = (report: ComplianceReport) => {
    // For demo purposes, return CSV format
    return generateCSVContent(report);
  };

  const generateXMLContent = (report: ComplianceReport) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<compliance_report>
  <title>${report.title}</title>
  <generated_date>${new Date().toISOString()}</generated_date>
  <generated_by>${user?.username}</generated_by>
  <data>
    <record>
      <patient_id>001</patient_id>
      <name>John Doe</name>
      <diagnosis>Hypertension</diagnosis>
      <treatment>Amlodipine</treatment>
      <status>Controlled</status>
    </record>
  </data>
</compliance_report>`;
  };

  const generatePDFContent = (report: ComplianceReport) => {
    return `${report.title}
Generated: ${new Date().toLocaleDateString()}
Generated by: ${user?.username}

This is a compliance report containing:
${report.requiredFields.map(field => `- ${field}`).join('\n')}

Report Summary:
Total Records: 150
Compliance Rate: 98.5%
Last Updated: ${new Date().toLocaleDateString()}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'regulatory': return <Shield className="h-4 w-4" />;
      case 'clinical': return <FileText className="h-4 w-4" />;
      case 'financial': return <Database className="h-4 w-4" />;
      case 'operational': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'regulatory': return 'bg-red-100 text-red-800';
      case 'clinical': return 'bg-blue-100 text-blue-800';
      case 'financial': return 'bg-green-100 text-green-800';
      case 'operational': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance & Export Center</h1>
          <p className="text-gray-600">Generate regulatory and compliance reports</p>
        </div>
        <div className="flex gap-4">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="regulatory">Regulatory</SelectItem>
              <SelectItem value="clinical">Clinical</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reports Generated</p>
                <p className="text-2xl font-bold text-blue-600">--</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-2xl font-bold text-green-600">--</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Above target</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-orange-600">3</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Records</p>
                <p className="text-2xl font-bold text-purple-600">2,847</p>
              </div>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Total in system</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <Badge className={getCategoryColor(report.category)}>
                      {getCategoryIcon(report.category)}
                      <span className="ml-1">{report.category}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Frequency:</span>
                      <Badge variant="outline">{report.frequency}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Format:</span>
                      <div className="flex items-center gap-1">
                        <FileSpreadsheet className="h-3 w-3" />
                        <span>{report.format.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="text-gray-500">Includes:</span>
                      <div className="mt-1 space-y-1">
                        {report.requiredFields.slice(0, 2).map((field, index) => (
                          <div key={index} className="text-xs text-gray-600">• {field}</div>
                        ))}
                        {report.requiredFields.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{report.requiredFields.length - 2} more fields
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4"
                      onClick={() => generateReport(report.id)}
                      disabled={isGenerating}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGenerating ? 'Generating...' : 'Generate Report'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Date Range</label>
                <div className="flex gap-2">
                  <Input 
                    type="date" 
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  />
                  <Input 
                    type="date" 
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Report Type</label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {complianceReports.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Additional Notes</label>
                <Textarea 
                  placeholder="Add any specific requirements or notes for this report..."
                  rows={4}
                />
              </div>
              
              <Button 
                className="w-full"
                disabled={!selectedReport || isGenerating}
                onClick={() => selectedReport && generateReport(selectedReport)}
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Custom Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}