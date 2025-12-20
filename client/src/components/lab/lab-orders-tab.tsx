import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, NoLabOrders } from "@/components/ui/empty-state";
import { format } from "date-fns";
import {
  TestTube,
  User,
  Eye,
  Printer,
  Plus,
  List,
  LayoutGrid,
  Grid3x3,
  ChevronLeft,
  ChevronRight,
  Clock
} from "lucide-react";

interface LabOrder {
  id: number;
  patient: {
    firstName: string;
    lastName: string;
  };
  status: string;
  priority?: string;
  notes?: string;
  items: Array<{
    id: number;
    labTest?: { name: string; category: string };
    testName?: string;
    testCategory?: string;
    status: string;
  }>;
  createdAt: string;
}

interface CustomViewSettings {
  showPatientInfo: boolean;
  showTestDetails: boolean;
  showTimestamps: boolean;
  showStatus: boolean;
  showPriority: boolean;
  showNotes: boolean;
  compactView: boolean;
  itemsPerPage: number;
}

interface LabOrdersTabProps {
  orders: LabOrder[];
  filteredOrders: LabOrder[];
  ordersLoading: boolean;
  viewMode: "compact" | "list" | "grid";
  selectedOrders: Set<number>;
  onToggleOrderSelection: (orderId: number) => void;
  onSelectAllOrders: () => void;
  onClearOrderSelection: () => void;
  onPrintSelectedOrders: () => void;
  onViewOrder: (order: LabOrder) => void;
  onPrintOrder: (order: LabOrder) => void;
  onAddResult: (orderItem: any) => void;
  onCreateOrder: () => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  customViewSettings: CustomViewSettings;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function LabOrdersTab({
  orders,
  filteredOrders,
  ordersLoading,
  viewMode,
  selectedOrders,
  onToggleOrderSelection,
  onSelectAllOrders,
  onClearOrderSelection,
  onPrintSelectedOrders,
  onViewOrder,
  onPrintOrder,
  onAddResult,
  onCreateOrder,
  getStatusColor,
  getPriorityColor,
  customViewSettings,
  currentPage,
  onPageChange
}: LabOrdersTabProps) {
  // Pagination logic
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * customViewSettings.itemsPerPage;
    const endIndex = startIndex + customViewSettings.itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, customViewSettings.itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / customViewSettings.itemsPerPage);

  // Adjust current page if it's out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    onPageChange(1);
  }
  if (ordersLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Loading lab orders...</p>
        </CardContent>
      </Card>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          {orders.length === 0 ? (
            <NoLabOrders onCreate={onCreateOrder} />
          ) : (
            <div className="text-center py-8">
              <TestTube className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders match your filters</h3>
              <p className="text-sm text-gray-600 mb-4">
                {orders.length} order{orders.length === 1 ? '' : 's'} found, but none match the current filters.
              </p>
              <Button onClick={onCreateOrder} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create New Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Determine effective view mode (customViewSettings.compactView overrides)
  const effectiveViewMode = customViewSettings.compactView ? "compact" : viewMode;

  return (
    <div className="space-y-2">
      {/* Selection Toolbar */}
      {selectedOrders.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectAllOrders();
                    } else {
                      onClearOrderSelection();
                    }
                  }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {selectedOrders.size} of {filteredOrders.length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={onPrintSelectedOrders}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Selected
                </Button>
                <Button size="sm" variant="outline" onClick={onClearOrderSelection}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Render based on view mode */}
      {effectiveViewMode === "compact" ? (
        <div className={`space-y-${customViewSettings.compactView ? '1' : '1.5'}`}>
          {paginatedOrders.map((order) => (
            <Card key={order.id} className={`hover:shadow-sm transition-all border border-gray-200 ${customViewSettings.compactView ? 'p-1' : ''}`}>
              <CardContent className={customViewSettings.compactView ? "p-2" : "p-2.5"}>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedOrders.has(order.id)}
                    onCheckedChange={() => onToggleOrderSelection(order.id)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {customViewSettings.showPatientInfo && (
                        <>
                          <User className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span className="font-medium text-sm text-gray-900 truncate">
                            {order.patient.firstName} {order.patient.lastName}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-gray-500">Order #{order.id}</span>
                      {customViewSettings.showTimestamps && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </>
                      )}
                    </div>
                    {customViewSettings.showStatus && (
                      <Badge className={`${getStatusColor(order.status)} text-xs px-1.5 py-0.5`} variant="outline">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    )}
                    {customViewSettings.showPriority && order.priority && (
                      <Badge className={`${getPriorityColor(order.priority)} text-xs px-1.5 py-0.5`} variant="outline">
                        {order.priority.toUpperCase()}
                      </Badge>
                    )}
                    {customViewSettings.showTestDetails && (
                      <>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {Array.isArray(order.items) ? order.items.length : 0} test
                          {Array.isArray(order.items) && order.items.length !== 1 ? 's' : ''}
                        </Badge>
                        {Array.isArray(order.items) && order.items.length > 0 && (
                          <span className="text-xs text-gray-600 truncate max-w-[200px]">
                            {order.items[0].labTest?.name || order.items[0].testName || 'Test'}
                          </span>
                        )}
                      </>
                    )}
                    <div className="flex items-center gap-1">
                      {Array.isArray(order.items) && order.items.length > 0 && 
                       order.items.some((item: any) => item.status === 'pending') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const pendingItem = order.items.find((item: any) => item.status === 'pending');
                            if (pendingItem) onAddResult(pendingItem);
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewOrder(order)}
                        className="h-6 px-2 text-xs"
                        title="View Details"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrintOrder(order)}
                        className="h-6 px-2 text-xs"
                        title="Print Order"
                      >
                        <Printer className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : effectiveViewMode === "list" ? (
        <div className="space-y-2">
          {paginatedOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-all border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={selectedOrders.has(order.id)}
                    onCheckedChange={() => onToggleOrderSelection(order.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {customViewSettings.showPatientInfo && (
                          <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          {customViewSettings.showPatientInfo && (
                            <h3 className="font-semibold text-sm text-gray-900 truncate">
                              {order.patient.firstName} {order.patient.lastName}
                            </h3>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Order #{order.id}</span>
                            {customViewSettings.showTimestamps && (
                              <>
                                <span>•</span>
                                <span>{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {customViewSettings.showStatus && (
                          <Badge className={`${getStatusColor(order.status)} text-xs px-1.5 py-0.5`} variant="outline">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        )}
                        {customViewSettings.showPriority && order.priority && (
                          <Badge className={`${getPriorityColor(order.priority)} text-xs px-1.5 py-0.5`} variant="outline">
                            {order.priority.toUpperCase()}
                          </Badge>
                        )}
                        {customViewSettings.showTestDetails && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {Array.isArray(order.items) ? order.items.length : 0} test
                            {Array.isArray(order.items) && order.items.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {customViewSettings.showTestDetails && Array.isArray(order.items) && order.items.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded text-xs">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <TestTube className="w-3 h-3 text-blue-600 flex-shrink-0" />
                              <span className="font-medium text-gray-900 truncate">
                                {item.labTest?.name || item.testName || 'Test'}
                              </span>
                              <span className="text-gray-500">{item.labTest?.category || item.testCategory || ''}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Badge
                                className={`${
                                  item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                } text-xs px-1.5 py-0.5`}
                                variant="outline"
                              >
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </Badge>
                              {item.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => onAddResult(item)}
                                  className="bg-green-600 hover:bg-green-700 text-white h-6 px-2 text-xs"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {customViewSettings.showNotes && order.notes && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <p className="text-gray-700">
                          <strong>Notes:</strong> {order.notes}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewOrder(order)}
                        className="h-7 px-2 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPrintOrder(order)}
                        className="h-7 px-2 text-xs"
                      >
                        <Printer className="w-3 h-3 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginatedOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-all border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-start gap-2 mb-2">
                  <Checkbox
                    checked={selectedOrders.has(order.id)}
                    onCheckedChange={() => onToggleOrderSelection(order.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    {customViewSettings.showPatientInfo && (
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <h3 className="font-semibold text-sm text-gray-900 truncate">
                          {order.patient.firstName} {order.patient.lastName}
                        </h3>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mb-2">
                      <div>Order #{order.id}</div>
                      {customViewSettings.showTimestamps && (
                        <div>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      {customViewSettings.showStatus && (
                        <Badge className={`${getStatusColor(order.status)} text-xs px-1.5 py-0.5`} variant="outline">
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      )}
                      {customViewSettings.showPriority && order.priority && (
                        <Badge className={`${getPriorityColor(order.priority)} text-xs px-1.5 py-0.5`} variant="outline">
                          {order.priority.toUpperCase()}
                        </Badge>
                      )}
                      {customViewSettings.showTestDetails && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {Array.isArray(order.items) ? order.items.length : 0} test
                          {Array.isArray(order.items) && order.items.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    {customViewSettings.showTestDetails && Array.isArray(order.items) && order.items.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {order.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="text-xs p-1.5 bg-gray-50 rounded">
                            <div className="font-medium text-gray-900 truncate">
                              {item.labTest?.name || item.testName || 'Test'}
                            </div>
                            <Badge
                              className={`${
                                item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              } text-xs px-1.5 py-0.5 mt-1`}
                              variant="outline"
                            >
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Badge>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{order.items.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                    {customViewSettings.showNotes && order.notes && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <p className="text-gray-700">
                          <strong>Notes:</strong> {order.notes}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewOrder(order)}
                        className="h-7 px-2 text-xs flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPrintOrder(order)}
                        className="h-7 px-2 text-xs"
                      >
                        <Printer className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * customViewSettings.itemsPerPage) + 1} to{' '}
                {Math.min(currentPage * customViewSettings.itemsPerPage, filteredOrders.length)} of{' '}
                {filteredOrders.length} orders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

