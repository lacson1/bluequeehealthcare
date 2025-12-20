import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Settings } from "lucide-react";

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

interface LabFiltersSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedPatient: number | null;
  onPatientChange: (patientId: number | null) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  patients: Patient[];
  testCategories: string[];
  onShowCustomView: () => void;
  onClearFilters: () => void;
}

export function LabFiltersSection({
  searchTerm,
  onSearchChange,
  selectedPatient,
  onPatientChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  patients,
  testCategories,
  onShowCustomView,
  onClearFilters
}: LabFiltersSectionProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients, tests, or order numbers..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onShowCustomView}
              className="h-9 px-3"
            >
              <Settings className="w-4 h-4 mr-1.5" />
              <span className="text-sm">Custom View</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 px-3"
            >
              <span className="text-sm">Clear</span>
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select
              value={selectedPatient?.toString() || "all"}
              onValueChange={(value) => onPatientChange(value === "all" ? null : Number.parseInt(value, 10))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Patients" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Patients</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                        </span>
                      </div>
                      <span>{patient.firstName} {patient.lastName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    Pending
                  </div>
                </SelectItem>
                <SelectItem value="processing">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Processing
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Completed
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Cancelled
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Specialties</SelectItem>
                {testCategories.sort().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

