import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlaskRound, Plus, Eye, Printer, Calendar, User, Clock, TestTube, MoreVertical, Download, Share, Edit, Trash2, RefreshCw } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";


interface PatientLabResultsProps {
  patientId: number;
}

interface LabOrder {
  id: number;
  patientId: number;
  orderedBy: number;
  status: string;
  priority: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface LabOrderItem {
  id: number;
  labOrderId: number;
  labTestId: number;
  result: string | null;
  remarks: string | null;
  status: string;
  completedBy: number | null;
  completedAt: string | null;
  testName: string;
  testCategory: string;
  referenceRange: string;
  units: string;
}

export default function PatientLabResults({ patientId }: PatientLabResultsProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { toast } = useToast();

  // Unified lab order actions
  const labOrderActions = {
    print: (orderId: number) => {
      window.open(`/api/lab-orders/${orderId}/print`, '_blank');
      toast({
        title: "Printing Lab Order",
        description: "Lab order is being prepared for printing.",
      });
    },
    download: async (orderId: number) => {
      try {
        const response = await fetch(`/api/lab-orders/${orderId}/download`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `lab-order-${orderId}-results.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast({
          title: "Download Complete",
          description: "Lab results downloaded successfully.",
        });
      } catch (error) {
        toast({
          title: "Download Failed",
          description: "Could not download lab results.",
          variant: "destructive",
        });
      }
    },
    share: (orderId: number) => {
      const shareUrl = `${window.location.origin}/patient-portal/lab-results/${orderId}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Patient Portal Link Copied",
        description: "Lab results link for patient portal copied to clipboard.",
      });
    },
    refresh: async (orderId: number) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: [`/api/patients/${patientId}/lab-orders`]
        });
        await queryClient.invalidateQueries({
          queryKey: [`/api/lab-orders/${orderId}/items`]
        });
        toast({
          title: "Refreshed",
          description: "Lab order data has been updated.",
        });
      } catch (error) {
        toast({
          title: "Refresh Failed",
          description: "Could not refresh lab order data.",
          variant: "destructive",
        });
      }
    },
    cancel: async (orderId: number) => {
      try {
        const response = await fetch(`/api/lab-orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' })
        });
        
        if (response.ok) {
          await queryClient.invalidateQueries({
            queryKey: [`/api/patients/${patientId}/lab-orders`]
          });
          toast({
            title: "Order Cancelled",
            description: "Lab order has been cancelled successfully.",
          });
        } else {
          throw new Error('Failed to cancel order');
        }
      } catch (error) {
        toast({
          title: "Cancellation Failed",
          description: "Could not cancel lab order.",
          variant: "destructive",
        });
      }
    }
  };

  const { data: labOrders = [], isLoading } = useQuery<LabOrder[]>({
    queryKey: [`/api/patients/${patientId}/lab-orders`],
    enabled: !!patientId,
  });

  const { data: labOrderItems = {} } = useQuery<Record<number, LabOrderItem[]>>({
    queryKey: [`/api/lab-orders/items/batch`],
    queryFn: async () => {
      const items: Record<number, LabOrderItem[]> = {};
      for (const order of labOrders) {
        const response = await fetch(`/api/lab-orders/${order.id}/items`);
        if (response.ok) {
          items[order.id] = await response.json();
        }
      }
      return items;
    },
    enabled: labOrders.length > 0,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'routine': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResultStatus = (result: string | null, status: string) => {
    if (status === 'completed' && result) {
      return 'bg-green-50 border-green-200 text-green-800';
    } else if (status === 'in_progress') {
      return 'bg-blue-50 border-blue-200 text-blue-800';
    } else {
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskRound className="h-5 w-5 text-green-500" />
            Laboratory Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Reusable component for lab order display
  const LabOrderCard = ({ order }: { order: any }) => (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-lg">Lab Order #{order.id}</h4>
            <Badge className={getStatusColor(order.status)}>
              {order.status ? order.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
            </Badge>
            <Badge className={getPriorityColor(order.priority)}>
              {order.priority ? order.priority.toUpperCase() : 'NORMAL'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
            <div className="bg-gray-50 p-3 rounded">
              <span className="font-medium text-gray-700 block">Order Date</span>
              <p className="text-gray-900">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="font-medium text-gray-700 block">Status</span>
              <p className="text-gray-900 capitalize">{order.status ? order.status.replace('_', ' ') : 'Unknown'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="font-medium text-gray-700 block">Priority</span>
              <p className="text-gray-900 capitalize">{order.priority || 'Normal'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
          >
            <Eye className="w-4 h-4 mr-1" />
            {selectedOrderId === order.id ? 'Hide' : 'View'} Tests
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => labOrderActions.print(order.id)}>
                <Printer className="w-4 h-4 mr-2" />
                Print Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => labOrderActions.download(order.id)}>
                <Download className="w-4 h-4 mr-2" />
                Download Results
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => labOrderActions.share(order.id)}>
                <Share className="w-4 h-4 mr-2" />
                Share Results Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => labOrderActions.refresh(order.id)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </DropdownMenuItem>
              {order.status === 'pending' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => labOrderActions.cancel(order.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cancel Order
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectedOrderId === order.id && labOrderItems[order.id] && (
        <div className="mt-4 pt-4 border-t">
          <h5 className="font-medium text-gray-900 mb-3">Test Items</h5>
          <div className="grid gap-3">
            {labOrderItems[order.id].map((item: any) => (
              <div key={item.id} className={`border rounded-lg p-3 ${getResultStatus(item.result, item.status)}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{item.testName}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.testCategory}
                      </Badge>
                    </div>
                    
                    {item.result ? (
                      <div className="bg-white/50 rounded p-2 mb-2">
                        <div className="text-sm">
                          <span className="font-medium">Result:</span> {item.result} {item.units && `(${item.units})`}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          <span className="font-medium">Reference:</span> {item.referenceRange}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 mb-2">
                        {item.status === 'pending' ? 'Awaiting sample collection' : 'Processing...'}
                      </div>
                    )}
                    
                    {item.remarks && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Remarks:</span> {item.remarks}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FlaskRound className="h-5 w-5 text-green-500" />
            Laboratory Results
            <span className="text-sm font-normal text-gray-500">
              View lab orders and test results for this patient
            </span>
          </CardTitle>
          <Button 
            onClick={() => {
              // Navigate to lab orders tab
              const event = new CustomEvent('switchToLabOrdersTab');
              window.dispatchEvent(event);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Order Lab Test
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <FlaskRound className="w-4 h-4" />
              All Orders
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              In Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {labOrders.length > 0 ? (
              <div className="space-y-4">
                {labOrders.map((order) => (
                  <LabOrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FlaskRound className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No lab orders yet</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Lab orders and results will appear here when available.
                </p>
                <Button 
                  onClick={() => {
                    // Navigate to lab orders tab
                    const event = new CustomEvent('switchToLabOrdersTab');
                    window.dispatchEvent(event);
                  }}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Order First Lab Test
                </Button>
              </div>
            )}
          </TabsContent>

          {['pending', 'completed', 'in_progress'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4 mt-4">
              {labOrders.filter(order => order.status === status).length > 0 ? (
                <div className="space-y-4">
                  {labOrders.filter(order => order.status === status).map((order) => (
                    <LabOrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FlaskRound className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No {status.replace('_', ' ')} lab orders</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}