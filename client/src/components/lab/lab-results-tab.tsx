import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { FileText, CheckCircle, Download, Eye, Printer, ChevronLeft, ChevronRight } from "lucide-react";

interface LabResult {
  id: number;
  patientId: number;
  patientName: string;
  testName: string;
  category: string;
  result: string;
  normalRange: string;
  status: string;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
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

interface LabResultsTabProps {
  results: LabResult[];
  filteredResults: LabResult[];
  selectedResults: Set<number>;
  onToggleResultSelection: (resultId: number) => void;
  onSelectAllResults: () => void;
  onClearResultSelection: () => void;
  onPrintSelectedResults: () => void;
  onViewResult: (result: LabResult) => void;
  onPrintResult: (result: LabResult) => void;
  generateLabResultPrintContent: (result: LabResult) => string;
  customViewSettings: CustomViewSettings;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function LabResultsTab({
  results,
  filteredResults,
  selectedResults,
  onToggleResultSelection,
  onSelectAllResults,
  onClearResultSelection,
  onPrintSelectedResults,
  onViewResult,
  onPrintResult,
  generateLabResultPrintContent,
  customViewSettings,
  currentPage,
  onPageChange
}: LabResultsTabProps) {
  // Pagination logic
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * customViewSettings.itemsPerPage;
    const endIndex = startIndex + customViewSettings.itemsPerPage;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, currentPage, customViewSettings.itemsPerPage]);

  const totalPages = Math.ceil(filteredResults.length / customViewSettings.itemsPerPage);

  // Adjust current page if it's out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    onPageChange(1);
  }
  if (filteredResults.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <EmptyState
            icon={FileText}
            title="No lab results found"
            description="Lab results will appear here once orders are processed"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* Results Selection Toolbar */}
      {selectedResults.size > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedResults.size === filteredResults.length && filteredResults.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectAllResults();
                      } else {
                        onClearResultSelection();
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All ({filteredResults.length})
                  </span>
                </div>
                <Badge variant="secondary">
                  {selectedResults.size} selected
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={onPrintSelectedResults}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Selected ({selectedResults.size})
                </Button>
                <Button size="sm" variant="outline" onClick={onClearResultSelection}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={customViewSettings.compactView ? "space-y-2" : "grid gap-3"}>
        {paginatedResults.map((result) => (
          <Card key={result.id} className={`hover:shadow-md transition-shadow ${customViewSettings.compactView ? 'border border-gray-200' : ''}`}>
            <CardContent className={customViewSettings.compactView ? "p-3" : "p-4"}>
              <div className={`flex ${customViewSettings.compactView ? 'items-center' : 'flex-col lg:flex-row lg:items-center'} justify-between gap-3`}>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedResults.has(result.id)}
                    onCheckedChange={() => onToggleResultSelection(result.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-3 ${customViewSettings.compactView ? '' : 'mb-2'}`}>
                      {customViewSettings.showTestDetails && (
                        <div className={`${customViewSettings.compactView ? 'p-1.5' : 'p-2'} bg-green-50 rounded-lg flex-shrink-0`}>
                          <CheckCircle className={`${customViewSettings.compactView ? 'w-4 h-4' : 'w-5 h-5'} text-green-600`} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 overflow-hidden">
                        {customViewSettings.showPatientInfo && (
                          <h3
                            className={`${customViewSettings.compactView ? 'text-sm' : 'font-semibold'} text-gray-900 truncate block`}
                            title={result.patientName || 'Unknown Patient'}
                          >
                            {result.patientName || 'Unknown Patient'}
                          </h3>
                        )}
                        {customViewSettings.showTestDetails && (
                          <p
                            className={`${customViewSettings.compactView ? 'text-xs' : 'text-sm'} text-gray-600 truncate block`}
                            title={`${result.testName || 'Unknown Test'} • ${result.category || 'General'}`}
                          >
                            {result.testName || 'Unknown Test'} • {result.category || 'General'}
                          </p>
                        )}
                      </div>
                    </div>

                    {customViewSettings.showTestDetails && (
                      <div className={`grid ${customViewSettings.compactView ? 'grid-cols-3 gap-2' : 'grid-cols-1 md:grid-cols-3 gap-3'} ${customViewSettings.compactView ? 'mt-2' : ''}`}>
                        <div>
                          <p className={`${customViewSettings.compactView ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Result</p>
                          <p className={`${customViewSettings.compactView ? 'text-sm' : 'text-lg'} font-semibold text-gray-900`}>{result.result}</p>
                        </div>
                        <div>
                          <p className={`${customViewSettings.compactView ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Reference Range</p>
                          <p className={`${customViewSettings.compactView ? 'text-xs' : 'text-sm'} text-gray-700`}>{result.normalRange || 'N/A'}</p>
                        </div>
                        {customViewSettings.showStatus && (
                          <div>
                            <p className={`${customViewSettings.compactView ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Status</p>
                            <Badge
                              className={
                                result.status === 'normal' ? 'bg-green-100 text-green-800' :
                                result.status === 'abnormal' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {customViewSettings.showNotes && result.notes && (
                      <div className={`mt-3 ${customViewSettings.compactView ? 'p-2' : 'p-3'} bg-gray-50 rounded-lg ${customViewSettings.compactView ? 'text-xs' : 'text-sm'}`}>
                        <p className={`${customViewSettings.compactView ? 'text-xs' : 'text-sm'} text-gray-700`}>
                          <strong>Notes:</strong> {result.notes}
                        </p>
                      </div>
                    )}

                    {customViewSettings.showTimestamps && result.reviewedBy && (
                      <div className={`mt-2 text-xs text-gray-500`}>
                        Reviewed by {result.reviewedBy} on{' '}
                        {result.reviewedAt && format(new Date(result.reviewedAt), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const resultContent = generateLabResultPrintContent(result);
                      const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
                      if (printWindow) {
                        printWindow.document.write(resultContent);
                        printWindow.document.close();
                        printWindow.focus();
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Preview & Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewResult(result)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Result
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * customViewSettings.itemsPerPage) + 1} to{' '}
                {Math.min(currentPage * customViewSettings.itemsPerPage, filteredResults.length)} of{' '}
                {filteredResults.length} results
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

