import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle, Search, ArrowRight, Calendar, Clock, Pill,
  TrendingUp, TrendingDown, Minus, Shield, FileText, User
} from "lucide-react";
import { formatPatientName } from "@/lib/patient-utils";

interface RiskPatient {
  id: number;
  name: string;
  riskLevel: 'high' | 'medium' | 'low';
  lastAssessment: string;
  nextAppointment: string | null;
  currentMedications: number;
  adherenceRate: number | null;
  lastPHQ9?: number;
  lastGAD7?: number;
  suicidalIdeation?: string;
  homicidalIdeation?: string;
  selfHarm?: string;
  riskToOthers?: string;
  lastConsultationDate?: string;
}

export default function PsychiatryRiskMonitor() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("risk");

  // Fetch all risk patients
  const { data: riskPatients = [], isLoading } = useQuery<RiskPatient[]>({
    queryKey: ['/api/psychiatry/risk-patients'],
    refetchInterval: 60000, // Refresh every minute
  });

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <Badge className="bg-red-600 text-white">HIGH RISK</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">MEDIUM RISK</Badge>;
      case 'low':
        return <Badge className="bg-green-600 text-white">LOW RISK</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return "border-red-300 bg-red-50";
      case 'medium':
        return "border-yellow-300 bg-yellow-50";
      case 'low':
        return "border-green-300 bg-green-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const getSeverityColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 70) return "text-red-600 font-bold";
    if (percentage >= 40) return "text-yellow-600 font-semibold";
    return "text-green-600";
  };

  const filteredPatients = riskPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === "all" || patient.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  }).sort((a, b) => {
    if (sortBy === "risk") {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    }
    if (sortBy === "date") {
      return new Date(b.lastAssessment).getTime() - new Date(a.lastAssessment).getTime();
    }
    return 0;
  });

  const highRiskCount = riskPatients.filter(p => p.riskLevel === 'high').length;
  const mediumRiskCount = riskPatients.filter(p => p.riskLevel === 'medium').length;
  const lowRiskCount = riskPatients.filter(p => p.riskLevel === 'low').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-blue-50/40">
        <div className="healthcare-header px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded-lg w-64 mb-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-blue-50/40">
      {/* Header */}
      <div className="healthcare-header px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Shield className="h-8 w-8" />
                Risk Monitor
              </h1>
              <p className="text-white/80 text-lg">
                Monitor and manage patient risk levels
              </p>
            </div>
            <Button
              onClick={() => setLocation('/psychiatry-dashboard')}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Risk Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                High Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{highRiskCount}</div>
              <p className="text-sm text-red-700 mt-1">Requiring immediate attention</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-300 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Medium Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{mediumRiskCount}</div>
              <p className="text-sm text-yellow-700 mt-1">Monitor closely</p>
            </CardContent>
          </Card>

          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Low Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{lowRiskCount}</div>
              <p className="text-sm text-green-700 mt-1">Routine follow-up</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk">Sort by Risk</SelectItem>
                  <SelectItem value="date">Sort by Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Patient List */}
        <div className="space-y-4">
          {filteredPatients.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No patients found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className={`cursor-pointer hover:shadow-lg transition-all ${getRiskColor(patient.riskLevel)}`}
                onClick={() => setLocation(`/patients/${patient.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold">{patient.name}</h3>
                        {getRiskBadge(patient.riskLevel)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Last Assessment:</span>
                          <span className="font-medium">
                            {new Date(patient.lastAssessment).toLocaleDateString()}
                          </span>
                        </div>

                        {patient.nextAppointment && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Next Appointment:</span>
                            <span className="font-medium">
                              {new Date(patient.nextAppointment).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <Pill className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Medications:</span>
                          <span className="font-medium">{patient.currentMedications}</span>
                        </div>

                        {patient.adherenceRate !== null && (
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Adherence:</span>
                            <span className={patient.adherenceRate < 80 ? "text-red-600 font-bold" : "text-green-600 font-medium"}>
                              {patient.adherenceRate}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Assessment Scores */}
                      {(patient.lastPHQ9 !== undefined || patient.lastGAD7 !== undefined) && (
                        <div className="flex gap-4 mb-4">
                          {patient.lastPHQ9 !== undefined && (
                            <div className="text-sm">
                              <span className="font-medium">PHQ-9: </span>
                              <span className={getSeverityColor(patient.lastPHQ9, 27)}>
                                {patient.lastPHQ9}/27
                              </span>
                            </div>
                          )}
                          {patient.lastGAD7 !== undefined && (
                            <div className="text-sm">
                              <span className="font-medium">GAD-7: </span>
                              <span className={getSeverityColor(patient.lastGAD7, 21)}>
                                {patient.lastGAD7}/21
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Risk Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 p-3 bg-white/50 rounded-lg">
                        {patient.suicidalIdeation && patient.suicidalIdeation !== 'None' && (
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                            <div>
                              <span className="font-semibold text-red-900">Suicidal Ideation: </span>
                              <span className="text-sm text-red-700">{patient.suicidalIdeation}</span>
                            </div>
                          </div>
                        )}
                        {patient.homicidalIdeation && patient.homicidalIdeation !== 'None' && (
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                            <div>
                              <span className="font-semibold text-red-900">Homicidal Ideation: </span>
                              <span className="text-sm text-red-700">{patient.homicidalIdeation}</span>
                            </div>
                          </div>
                        )}
                        {patient.selfHarm && patient.selfHarm !== 'None' && (
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div>
                              <span className="font-semibold text-yellow-900">Self-Harm: </span>
                              <span className="text-sm text-yellow-700">{patient.selfHarm}</span>
                            </div>
                          </div>
                        )}
                        {patient.riskToOthers && patient.riskToOthers !== 'Low risk' && (
                          <div className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-orange-600 mt-0.5" />
                            <div>
                              <span className="font-semibold text-orange-900">Risk to Others: </span>
                              <span className="text-sm text-orange-700">{patient.riskToOthers}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/patients/${patient.id}`);
                        }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        View Patient
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open consultation wizard with risk assessment first
                          setLocation(`/patients/${patient.id}?action=consult&step=risk`);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Assess Risk
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

