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
    const statusColors = {
      normal: 'bg-green-100 text-green-800',
      abnormal: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

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
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Reviewed Lab Results ({reviewedResults.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviewedResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reviewed lab results available. Complete results will appear here after review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewedResults.map(result => (
                <div
                  key={result.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h4 className="font-medium text-lg">{result.testName}</h4>
                        {getStatusBadge(result.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Patient:</span>
                          <p className="font-medium">{result.patientName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Result:</span>
                          <p className="font-medium text-lg">{result.result} {result.units}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Normal Range:</span>
                          <p>{result.normalRange}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Completed:</span>
                          <p>{format(new Date(result.completedDate), 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>Category: {result.category}</span>
                        <span>Reviewed by: {result.reviewedBy}</span>
                        {result.remarks && <span>Has remarks</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Printer className="h-4 w-4 mr-2" />
                            Print Result
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {result.remarks && (
                    <>
                      <Separator className="my-3" />
                      <div className="text-sm">
                        <span className="text-muted-foreground font-medium">Remarks:</span>
                        <p className="mt-1">{result.remarks}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
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