import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, Minus, FlaskRound, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { format } from "date-fns";

interface PatientLabHistoryProps {
  patientId: number;
}

export function PatientLabHistory({ patientId }: PatientLabHistoryProps) {
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  // Fetch all lab results for this patient
  const { data: labResults, isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/labs`],
  });

  const toggleTest = (testName: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testName)) {
      newExpanded.delete(testName);
    } else {
      newExpanded.add(testName);
    }
    setExpandedTests(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-slate-500">
          <Clock className="h-4 w-4 animate-spin" />
          Loading lab history...
        </div>
      </div>
    );
  }

  if (!labResults || labResults.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FlaskRound className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Lab History</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Historical lab results will appear here once tests are completed and reviewed.
        </p>
      </div>
    );
  }

  // Group results by test name for trend analysis
  const groupedResults = labResults.reduce((acc: any, result: any) => {
    const testName = result.testName || 'Unknown Test';
    if (!acc[testName]) {
      acc[testName] = [];
    }
    acc[testName].push(result);
    return acc;
  }, {});

  // Sort each group by date (newest first)
  Object.keys(groupedResults).forEach(testName => {
    groupedResults[testName].sort((a: any, b: any) => 
      new Date(b.testDate || b.completedDate || b.createdAt).getTime() - 
      new Date(a.testDate || a.completedDate || a.createdAt).getTime()
    );
  });

  const getTrendIcon = (results: any[]) => {
    if (results.length < 2) return <Minus className="h-4 w-4 text-gray-400" />;
    
    const latest = parseFloat(results[0].result);
    const previous = parseFloat(results[1].result);
    
    if (isNaN(latest) || isNaN(previous)) return <Minus className="h-4 w-4 text-gray-400" />;
    
    if (latest > previous) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (latest < previous) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      'normal': { className: 'bg-green-50 text-green-700 border-green-200', label: 'Normal' },
      'abnormal': { className: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Abnormal' },
      'critical': { className: 'bg-red-50 text-red-700 border-red-200', label: 'Critical' },
      'pending': { className: 'bg-gray-50 text-gray-700 border-gray-200', label: 'Pending' },
      'completed': { className: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Completed' },
    };

    const config = statusConfig[status?.toLowerCase()] || { 
      className: 'bg-gray-50 text-gray-700 border-gray-200', 
      label: status || 'Unknown' 
    };
    return (
      <Badge className={`${config.className} border px-2 py-0.5 text-xs font-medium`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Complete Lab History</h3>
          <p className="text-sm text-slate-500 mt-1">
            All historical test results with trend analysis and visual indicators
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {Object.keys(groupedResults).length} {Object.keys(groupedResults).length === 1 ? 'Test Type' : 'Test Types'}
        </Badge>
      </div>

      {/* Test Groups */}
      {Object.entries(groupedResults).map(([testName, results]: [string, any]) => {
        const isExpanded = expandedTests.has(testName);
        const displayCount = isExpanded ? results.length : Math.min(3, results.length);
        const hasMore = results.length > 3;

        return (
          <Card key={testName} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FlaskRound className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-semibold">{testName}</span>
                  {getTrendIcon(results)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {results.length} {results.length === 1 ? 'result' : 'results'}
                  </Badge>
                  {hasMore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTest(testName)}
                      className="h-7 px-2"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show All
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.slice(0, displayCount).map((result: any, idx: number) => {
                  const testDate = result.testDate || result.completedDate || result.createdAt;
                  const isLatest = idx === 0;
                  
                  return (
                    <div
                      key={result.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        isLatest 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${
                          isLatest ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Calendar className={`h-4 w-4 ${
                            isLatest ? 'text-blue-600' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">
                              {testDate ? format(new Date(testDate), 'MMM dd, yyyy') : 'Unknown date'}
                            </span>
                            {isLatest && (
                              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                                Latest
                              </Badge>
                            )}
                            {testDate && (
                              <span className="text-xs text-gray-500">
                                {format(new Date(testDate), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          {result.notes && (
                            <p className="text-xs text-slate-600 mt-1 line-clamp-1">{result.notes}</p>
                          )}
                          {result.category && (
                            <p className="text-xs text-slate-500 mt-1">Category: {result.category}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right min-w-[100px]">
                          <div className={`font-bold text-lg ${
                            result.status === 'critical' ? 'text-red-600' :
                            result.status === 'abnormal' ? 'text-yellow-600' :
                            'text-gray-900'
                          }`}>
                            {result.result || 'N/A'}
                            {result.units && (
                              <span className="text-sm font-normal text-gray-500 ml-1">
                                {result.units}
                              </span>
                            )}
                          </div>
                          {result.normalRange && (
                            <div className="text-xs text-gray-500 mt-1">
                              Range: {result.normalRange}
                            </div>
                          )}
                        </div>
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Footer */}
              {results.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>
                      Showing {displayCount} of {results.length} results
                    </span>
                    <span>
                      First test: {format(new Date(results[results.length - 1].testDate || results[results.length - 1].completedDate || results[results.length - 1].createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Footer Summary */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-slate-600">
          Total of <span className="font-semibold">{labResults.length}</span> lab results across{' '}
          <span className="font-semibold">{Object.keys(groupedResults).length}</span> different test types
        </p>
      </div>
    </div>
  );
}
