import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TestTube, ChevronDown, ChevronRight, Calendar, User, Clock } from "lucide-react";
import { format } from "date-fns";

interface LabOrdersListProps {
  patientId: number;
  showPendingOnly?: boolean;
  showAll?: boolean;
}

interface LabOrder {
  id: number;
  patientId: number;
  orderedBy: number;
  createdAt: string;
  status?: string;
}

interface LabOrderItem {
  id: number;
  labOrderId: number;
  labTestId: number;
  result?: string;
  remarks?: string;
  completedAt?: string;
  testName: string;
}

export default function LabOrdersList({ patientId, showPendingOnly, showAll }: LabOrdersListProps) {
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);

  const { data: labOrders = [], isLoading } = useQuery<LabOrder[]>({
    queryKey: ['/api/patients', patientId, 'lab-orders']
  });

  // Filter lab orders based on props
  const filteredLabOrders = labOrders.filter(order => {
    if (showPendingOnly) {
      return order.status === 'pending' || order.status === 'in_progress';
    }
    if (showAll) {
      return true; // Show all orders
    }
    // Default behavior - show recent orders
    return true;
  });

  const toggleOrder = (orderId: number) => {
    setExpandedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <TestTube className="h-6 w-6 animate-pulse" />
            <span className="ml-2">Loading lab orders...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredLabOrders.length === 0) {
    const emptyMessage = showPendingOnly 
      ? "No pending laboratory orders found for this patient."
      : showAll 
        ? "No laboratory orders found for this patient."
        : "No recent laboratory orders found for this patient.";
        
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Laboratory Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Laboratory Orders ({filteredLabOrders.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredLabOrders.map(order => (
          <LabOrderCard
            key={order.id}
            order={order}
            isExpanded={expandedOrders.includes(order.id)}
            onToggle={() => toggleOrder(order.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface LabOrderCardProps {
  order: LabOrder;
  isExpanded: boolean;
  onToggle: () => void;
}

function LabOrderCard({ order, isExpanded, onToggle }: LabOrderCardProps) {
  const { data: orderItems = [], isLoading: itemsLoading, error } = useQuery<LabOrderItem[]>({
    queryKey: ['/api/lab-orders', order.id, 'items'],
    enabled: isExpanded,
    retry: false
  });

  const completedTests = orderItems.filter(item => item.completedAt);
  const pendingTests = orderItems.filter(item => !item.completedAt);

  // Handle error state for lab order items
  if (error && isExpanded) {
    console.warn(`Could not load items for lab order ${order.id}:`, error);
  }

  const getOrderStatus = () => {
    if (orderItems.length === 0) return 'pending';
    if (completedTests.length === orderItems.length) return 'completed';
    if (completedTests.length > 0) return 'partial';
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Completed</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Partial</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Pending</Badge>;
    }
  };

  return (
    <div className="border rounded-lg">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(getOrderStatus())}
              {orderItems.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {completedTests.length}/{orderItems.length} tests
                </span>
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 border-t">
            {itemsLoading ? (
              <div className="py-4 text-center text-muted-foreground">
                Loading test details...
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {orderItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{item.testName}</h4>
                      {item.result && (
                        <p className="text-sm font-mono mt-1 text-blue-600 dark:text-blue-400">
                          Result: {item.result}
                        </p>
                      )}
                      {item.remarks && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Notes: {item.remarks}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.completedAt ? (
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            Completed
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(item.completedAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}