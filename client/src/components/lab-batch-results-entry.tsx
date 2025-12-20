import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Save, 
  Loader2,
  FileText,
  User,
  Calendar,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface LabWorksheet {
  id: number;
  name: string;
  status: string;
  technicianId: number | null;
  createdAt: Date;
  items?: WorksheetItem[];
}

interface WorksheetItem {
  id: number;
  labOrderItemId: number;
  position: number | null;
  labOrderItem?: {
    id: number;
    labTest: {
      id: number;
      name: string;
      referenceRange: string | null;
      unit: string | null;
    };
    patient?: {
      id: number;
      firstName: string;
      lastName: string;
    };
    labOrder?: {
      id: number;
      createdAt: Date;
    };
  };
}

interface BatchResult {
  itemId: number;
  value: string;
  remarks: string;
  isAbnormal: boolean;
}

export default function LabBatchResultsEntry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedWorksheet, setSelectedWorksheet] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, BatchResult>>({});

  // Fetch lab worksheets
  const { data: worksheets = [], isLoading: worksheetsLoading } = useQuery<LabWorksheet[]>({
    queryKey: ['/api/lab-worksheets'],
  });

  // Fetch worksheet details when selected
  const { data: worksheetDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['/api/lab-worksheets', selectedWorksheet],
    queryFn: async () => {
      if (!selectedWorksheet) return null;
      const response = await fetch(`/api/lab-worksheets/${selectedWorksheet}`);
      if (!response.ok) throw new Error('Failed to fetch worksheet');
      return response.json();
    },
    enabled: !!selectedWorksheet,
  });

  // Batch results mutation
  const batchResultsMutation = useMutation({
    mutationFn: async (data: { worksheetId: number; results: BatchResult[] }) => {
      return apiRequest(`/api/lab-worksheets/${data.worksheetId}/batch-results`, 'PATCH', {
        results: data.results
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Batch results saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-worksheets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-orders'] });
      setResults({});
      setSelectedWorksheet(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save batch results",
        variant: "destructive",
      });
    }
  });

  const handleResultChange = (itemId: number, field: keyof BatchResult, value: string | boolean) => {
    setResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        itemId,
        [field]: value,
        value: prev[itemId]?.value || '',
        remarks: prev[itemId]?.remarks || '',
        isAbnormal: prev[itemId]?.isAbnormal || false,
      }
    }));
  };

  const handleSubmit = () => {
    if (!selectedWorksheet) return;
    
    const resultsArray = Object.values(results).filter(r => r.value.trim() !== '');
    if (resultsArray.length === 0) {
      toast({
        title: "No Results",
        description: "Please enter at least one result",
        variant: "destructive",
      });
      return;
    }

    batchResultsMutation.mutate({
      worksheetId: selectedWorksheet,
      results: resultsArray
    });
  };

  const worksheetItems = worksheetDetails?.items || [];
  const openWorksheets = worksheets.filter(w => w.status === 'open' || w.status === 'in_progress');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Batch Results Entry</h2>
          <p className="text-gray-600">Enter lab results for multiple tests at once</p>
        </div>
      </div>

      {/* Worksheet Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Select Worksheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {worksheetsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : openWorksheets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No open worksheets available</p>
              <p className="text-sm mt-2">Create a worksheet to start entering results</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {openWorksheets.map((worksheet) => (
                <div
                  key={worksheet.id}
                  onClick={() => setSelectedWorksheet(worksheet.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedWorksheet === worksheet.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{worksheet.name}</h3>
                      <p className="text-sm text-gray-600">
                        Created {format(new Date(worksheet.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <Badge variant={worksheet.status === 'in_progress' ? 'default' : 'secondary'}>
                      {worksheet.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Entry Form */}
      {selectedWorksheet && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Enter Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : worksheetItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No items in this worksheet</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {worksheetItems.map((item, index) => {
                    const test = item.labOrderItem?.labTest;
                    const patient = item.labOrderItem?.patient;
                    const order = item.labOrderItem?.labOrder;
                    const result = results[item.labOrderItemId] || {
                      itemId: item.labOrderItemId,
                      value: '',
                      remarks: '',
                      isAbnormal: false
                    };

                    return (
                      <div key={item.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {test?.name || 'Unknown Test'}
                              </h4>
                              {test?.referenceRange && (
                                <Badge variant="outline" className="text-xs">
                                  Ref: {test.referenceRange}
                                </Badge>
                              )}
                            </div>
                            {patient && (
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {patient.firstName} {patient.lastName}
                                </div>
                                {order && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500">#{index + 1}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`value-${item.id}`}>
                              Result {test?.unit && `(${test.unit})`}
                            </Label>
                            <Input
                              id={`value-${item.id}`}
                              value={result.value}
                              onChange={(e) => handleResultChange(item.labOrderItemId, 'value', e.target.value)}
                              placeholder="Enter result"
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`remarks-${item.id}`}>Remarks</Label>
                            <Input
                              id={`remarks-${item.id}`}
                              value={result.remarks}
                              onChange={(e) => handleResultChange(item.labOrderItemId, 'remarks', e.target.value)}
                              placeholder="Optional remarks"
                              className="w-full"
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`abnormal-${item.id}`}
                                checked={result.isAbnormal}
                                onCheckedChange={(checked) => 
                                  handleResultChange(item.labOrderItemId, 'isAbnormal', checked === true)
                                }
                              />
                              <Label htmlFor={`abnormal-${item.id}`} className="cursor-pointer">
                                Abnormal
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {Object.values(results).filter(r => r.value.trim() !== '').length} of {worksheetItems.length} results entered
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedWorksheet(null);
                        setResults({});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={batchResultsMutation.isPending || Object.values(results).filter(r => r.value.trim() !== '').length === 0}
                    >
                      {batchResultsMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Batch Results
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

