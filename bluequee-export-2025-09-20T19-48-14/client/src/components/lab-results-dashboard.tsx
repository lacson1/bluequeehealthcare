import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LabResultEntryEnhanced from "./lab-result-entry-enhanced";
import { 
  TestTube, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  RefreshCw,
  Settings,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";

interface LabResult {
  id: number;
  patientId: number;
  patientName: string;
  testName: string;
  result: string;
  normalRange?: string;
  status: string;
  completedDate: string;
  reviewedBy?: string;
  category?: string;
  units?: string;
  remarks?: string;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
}

export default function LabResultsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [showNewResultDialog, setShowNewResultDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const queryClient = useQueryClient();

  // Fetch lab results with pagination
  const { data: labResultsResponse, isLoading } = useQuery({
    queryKey: ['/api/lab-results/reviewed', selectedPatient, statusFilter, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedPatient) params.append('patientId', selectedPatient.toString());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateRange !== 'all') params.append('dateRange', dateRange);
      
      const response = await fetch(`/api/lab-results/reviewed?${params}`);
      return response.json();
    }
  });

  const labResults = labResultsResponse?.data || [];

  // Fetch patients for filtering
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients']
  });

  // Delete result mutation
  const deleteResultMutation = useMutation({
    mutationFn: async (resultId: number) => {
      return apiRequest(`/api/lab-results/${resultId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-results/reviewed'] });
      toast({
        title: "Lab result deleted successfully",
        description: "The lab result has been removed from the system"
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete lab result",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  // Filtered and searched results
  const filteredResults = useMemo(() => {
    return labResults.filter((result: LabResult) => {
      const matchesSearch = !searchTerm || 
        result.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.result?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || result.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [labResults, searchTerm, statusFilter, categoryFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'abnormal': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'normal': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'abnormal': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleViewResult = (result: LabResult) => {
    setSelectedResult(result);
    setShowViewDialog(true);
  };

  const handleEditResult = (result: LabResult) => {
    setSelectedResult(result);
    setShowEditDialog(true);
  };

  const handleDeleteResult = (resultId: number) => {
    if (confirm('Are you sure you want to delete this lab result?')) {
      deleteResultMutation.mutate(resultId);
    }
  };

  const handlePrintResult = (result: LabResult) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab Result - ${result.testName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .patient-info { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .result-section { margin-bottom: 20px; }
            .status { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; }
            .status.completed { background: #d1fae5; color: #065f46; }
            .status.abnormal { background: #fed7aa; color: #9a3412; }
            .status.critical { background: #fecaca; color: #991b1b; }
            .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laboratory Result Report</h1>
            <p>Generated on ${format(new Date(), 'PPP')}</p>
          </div>
          
          <div class="patient-info">
            <h2>Patient Information</h2>
            <p><strong>Name:</strong> ${result.patientName}</p>
            <p><strong>Patient ID:</strong> ${result.patientId}</p>
          </div>
          
          <div class="result-section">
            <h2>Test Results</h2>
            <p><strong>Test Name:</strong> ${result.testName}</p>
            <p><strong>Result:</strong> ${result.result}</p>
            <p><strong>Normal Range:</strong> ${result.normalRange || 'N/A'}</p>
            <p><strong>Units:</strong> ${result.units || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status ${result.status}">${result.status.toUpperCase()}</span></p>
            <p><strong>Completed Date:</strong> ${format(new Date(result.completedDate), 'PPP')}</p>
            <p><strong>Reviewed By:</strong> ${result.reviewedBy || 'Lab Staff'}</p>
            ${result.remarks ? `<p><strong>Remarks:</strong> ${result.remarks}</p>` : ''}
          </div>
          
          <div class="footer">
            <p>This is an official laboratory report. Please consult with your healthcare provider for interpretation.</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const exportToCSV = () => {
    const headers = ['Patient Name', 'Test Name', 'Result', 'Normal Range', 'Status', 'Date', 'Reviewed By'];
    const csvContent = [
      headers.join(','),
      ...filteredResults.map((result: LabResult) => [
        result.patientName,
        result.testName,
        `"${result.result}"`,
        result.normalRange || '',
        result.status,
        format(new Date(result.completedDate), 'yyyy-MM-dd'),
        result.reviewedBy || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-results-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <TestTube className="w-8 h-8 text-blue-600" />
            </div>
            Lab Results Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage and review laboratory test results</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowNewResultDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Result
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient, test, or result..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Patient Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Patient</label>
              <Select value={selectedPatient?.toString() || "all"} onValueChange={(value) => setSelectedPatient(value === "all" ? null : parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="All patients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="abnormal">Abnormal</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Results</p>
                <p className="text-2xl font-bold text-gray-900">{filteredResults.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TestTube className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredResults.filter((r: LabResult) => r.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredResults.filter((r: LabResult) => r.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abnormal</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredResults.filter((r: LabResult) => ['abnormal', 'critical'].includes(r.status)).length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Lab Results ({filteredResults.length})
            </span>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/lab-results/reviewed'] })}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No lab results found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-gray-600">Patient</th>
                    <th className="text-left p-3 font-medium text-gray-600">Test</th>
                    <th className="text-left p-3 font-medium text-gray-600">Result</th>
                    <th className="text-left p-3 font-medium text-gray-600">Status</th>
                    <th className="text-left p-3 font-medium text-gray-600">Date</th>
                    <th className="text-left p-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result: LabResult) => (
                    <tr key={result.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{result.patientName}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{result.testName}</span>
                      </td>
                      <td className="p-3">
                        <div className="max-w-xs truncate" title={result.result}>
                          {result.result}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={`${getStatusColor(result.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(result.status)}
                          {result.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(result.completedDate), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewResult(result)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditResult(result)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintResult(result)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteResult(result.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Result Dialog */}
      <Dialog open={showNewResultDialog} onOpenChange={setShowNewResultDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lab Result</DialogTitle>
            <DialogDescription>
              Enter a new laboratory test result for a patient
            </DialogDescription>
          </DialogHeader>
          <LabResultEntryEnhanced
            onSuccess={() => setShowNewResultDialog(false)}
            onCancel={() => setShowNewResultDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Result Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lab Result</DialogTitle>
            <DialogDescription>
              Update the laboratory test result information
            </DialogDescription>
          </DialogHeader>
          {selectedResult && (
            <LabResultEntryEnhanced
              initialData={selectedResult}
              onSuccess={() => setShowEditDialog(false)}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Result Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lab Result Details</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Patient</label>
                  <p className="font-medium">{selectedResult.patientName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Test Name</label>
                  <p className="font-medium">{selectedResult.testName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Result</label>
                  <p className="font-medium">{selectedResult.result}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Normal Range</label>
                  <p className="font-medium">{selectedResult.normalRange || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusColor(selectedResult.status)}>
                    {selectedResult.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="font-medium">{format(new Date(selectedResult.completedDate), 'PPP')}</p>
                </div>
              </div>
              {selectedResult.remarks && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Remarks</label>
                  <p className="font-medium">{selectedResult.remarks}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => handlePrintResult(selectedResult)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button onClick={() => setShowViewDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}