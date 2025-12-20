import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TestTube, Plus, FileText, Clock, User, Calendar, Eye, Printer, Download, MoreVertical, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import LabResultEntry from "@/components/lab-result-entry-fixed";
import LabOrderForm from "@/components/lab-order-form";
import { useRole } from "@/components/role-guard";

interface LabOrder {
  id: number;
  patientId: number;
  orderedBy: number;
  status: string;
  createdAt: string;
  patient?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
}

// Component for displaying pending lab orders
function PendingLabOrders() {
  const { data: pendingOrders = [], isLoading } = useQuery<LabOrder[]>({
    queryKey: ['/api/lab-orders/pending']
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-spin" />
            Loading pending orders...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Lab Orders ({pendingOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending lab orders</p>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Order #{order.id}</Badge>
                        <Badge variant="secondary">{order.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {order.patient?.firstName} {order.patient?.lastName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(order.createdAt), 'PPp')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Printer className="w-4 h-4 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Component for displaying completed lab results
function CompletedLabResults() {
  const { data: completedOrders = [], isLoading } = useQuery<LabOrder[]>({
    queryKey: ['/api/lab-orders/completed']
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-spin" />
            Loading completed results...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Completed Lab Results ({completedOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No completed lab results</p>
          ) : (
            <div className="space-y-4">
              {completedOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Order #{order.id}</Badge>
                        <Badge variant="default">Completed</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {order.patient?.firstName} {order.patient?.lastName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(order.createdAt), 'PPp')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Results
                      </Button>
                      <Button variant="outline" size="sm">
                        <Printer className="w-4 h-4 mr-1" />
                        Print Report
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface CompletedLabResult {
  id: number;
  orderId: number;
  patientName: string;
  testName: string;
  result: string;
  normalRange: string;
  status: 'normal' | 'abnormal' | 'critical';
  completedDate: string;
  reviewedBy: string;
  category: string;
  units?: string;
  remarks?: string;
}

function ReviewedResults() {
  const { data: reviewedResults = [], isLoading } = useQuery<CompletedLabResult[]>({
    queryKey: ['/api/lab-results/reviewed']
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      normal: { 
        bg: 'bg-green-50', 
        text: 'text-green-700', 
        border: 'border-green-200',
        icon: '✓'
      },
      abnormal: { 
        bg: 'bg-yellow-50', 
        text: 'text-yellow-700', 
        border: 'border-yellow-200',
        icon: '⚠'
      },
      critical: { 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        border: 'border-red-200',
        icon: '⚡'
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: '•'
    };
    
    return (
      <Badge className={`${config.bg} ${config.text} ${config.border} border px-3 py-1 font-semibold`}>
        <span className="mr-1">{config.icon}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Group results by date
  const groupedByDate = reviewedResults.reduce((acc, result) => {
    const dateKey = format(new Date(result.completedDate), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(result);
    return acc;
  }, {} as Record<string, CompletedLabResult[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span>Loading reviewed results...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Reviewed Lab Results ({reviewedResults.length})
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {sortedDates.length} {sortedDates.length === 1 ? 'day' : 'days'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {reviewedResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No reviewed lab results available</p>
              <p className="text-sm">Complete results will appear here after review.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedDates.map(dateKey => {
                const dateResults = groupedByDate[dateKey];
                const displayDate = format(new Date(dateKey), 'EEEE, MMMM dd, yyyy');
                const isToday = dateKey === format(new Date(), 'yyyy-MM-dd');
                
                return (
                  <div key={dateKey} className="space-y-4">
                    {/* Date Header */}
                    <div className="flex items-center gap-3 pb-2 border-b">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {isToday ? 'Today' : displayDate}
                      </h3>
                      <Badge variant="secondary" className="ml-auto">
                        {dateResults.length} {dateResults.length === 1 ? 'result' : 'results'}
                      </Badge>
                    </div>

                    {/* Results for this date */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {dateResults.map(result => (
                        <Card
                          key={result.id}
                          className={`hover:shadow-lg transition-all duration-200 ${
                            result.status === 'critical' 
                              ? 'border-red-300 bg-red-50/30' 
                              : result.status === 'abnormal'
                              ? 'border-yellow-300 bg-yellow-50/30'
                              : 'border-gray-200'
                          }`}
                        >
                          <CardContent className="p-5">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                                  {result.testName}
                                </h4>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span className="truncate">{result.patientName}</span>
                                </p>
                              </div>
                              {getStatusBadge(result.status)}
                            </div>

                            {/* Main Result Display */}
                            <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Test Result</p>
                                <p className="text-3xl font-bold text-gray-900 mb-1">
                                  {result.result}
                                  {result.units && (
                                    <span className="text-lg font-normal text-muted-foreground ml-1">
                                      {result.units}
                                    </span>
                                  )}
                                </p>
                                {result.normalRange && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Normal Range: <span className="font-medium">{result.normalRange}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Category:</span>
                                <span className="font-medium">{result.category}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Completed:</span>
                                <span className="font-medium">
                                  {format(new Date(result.completedDate), 'HH:mm')}
                                </span>
                              </div>
                              {result.reviewedBy && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Reviewed by:</span>
                                  <span className="font-medium truncate max-w-[120px]">
                                    {result.reviewedBy}
                                  </span>
                                </div>
                              )}
                              {result.orderId && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Order #:</span>
                                  <span className="font-medium">{result.orderId}</span>
                                </div>
                              )}
                            </div>

                            {/* Remarks */}
                            {result.remarks && (
                              <>
                                <Separator className="my-3" />
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                  <p className="text-xs font-medium text-blue-900 mb-1">Remarks:</p>
                                  <p className="text-xs text-blue-800">{result.remarks}</p>
                                </div>
                              </>
                            )}

                            {/* Actions */}
                            <div className="mt-4 pt-4 border-t">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="w-full">
                                    <MoreVertical className="h-4 w-4 mr-2" />
                                    Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Result
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export PDF
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LabResults() {
  const { user } = useRole();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Fixed Header Section */}
      <div className="bg-gray-50 border-b border-gray-200 p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <TestTube className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Laboratory Results</h1>
            <p className="text-sm text-gray-600">
              Manage pending lab orders and enter test results
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse' ? (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Results
              </TabsTrigger>
              <TabsTrigger value="reviewed" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Reviewed Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <div className="space-y-6">
                <LabResultEntry />
              </div>
            </TabsContent>

            <TabsContent value="reviewed" className="mt-6">
              <ReviewedResults />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Access Restricted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You don't have permission to access the laboratory results management system. 
                Please contact your administrator if you need access.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}