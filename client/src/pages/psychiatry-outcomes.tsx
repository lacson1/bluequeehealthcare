import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart, TrendingUp, TrendingDown, Users,
    Activity, Calendar, Pill, Brain, ArrowLeft, Download, Filter
} from "lucide-react";

interface OutcomeMetrics {
    totalPatients: number;
    improved: number;
    stable: number;
    declined: number;
    averageImprovement: number;
    medicationAdherence: number;
    therapyCompletion: number;
    averageTreatmentDuration: number;
}

interface PatientOutcome {
    id: number;
    name: string;
    diagnosis: string;
    startDate: string;
    lastAssessment: string;
    phq9Initial: number;
    phq9Current: number;
    gad7Initial: number;
    gad7Current: number;
    status: 'improved' | 'stable' | 'declined';
    medicationAdherence: number;
    therapySessions: number;
    improvementPercentage: number;
}

export default function PsychiatryOutcomes() {
    const [, setLocation] = useLocation();
    const [timeRange, setTimeRange] = useState<'30days' | '90days' | '1year' | 'all'>('90days');
    const [statusFilter, setStatusFilter] = useState<'all' | 'improved' | 'stable' | 'declined'>('all');

    // Fetch outcomes data
    const { data: metrics, isLoading: metricsLoading } = useQuery<OutcomeMetrics>({
        queryKey: ['/api/psychiatry/outcomes/metrics', timeRange],
        refetchInterval: 60000,
    });

    // Fetch patient outcomes
    const { data: patientOutcomes = [], isLoading: outcomesLoading } = useQuery<PatientOutcome[]>({
        queryKey: ['/api/psychiatry/outcomes/patients', timeRange, statusFilter],
        refetchInterval: 60000,
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'improved':
                return <Badge className="bg-green-600 text-white">Improved</Badge>;
            case 'stable':
                return <Badge className="bg-blue-600 text-white">Stable</Badge>;
            case 'declined':
                return <Badge className="bg-red-600 text-white">Declined</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const getImprovementColor = (percentage: number) => {
        if (percentage > 0) return "text-green-600";
        if (percentage < 0) return "text-red-600";
        return "text-gray-600";
    };

    const getImprovementIcon = (percentage: number) => {
        if (percentage > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (percentage < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
        return <Activity className="h-4 w-4 text-gray-600" />;
    };

    if (metricsLoading || outcomesLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-blue-50/40">
                <div className="healthcare-header px-6 py-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="animate-pulse">
                            <div className="h-8 bg-white/20 rounded-lg w-64 mb-4"></div>
                            <div className="h-4 bg-white/20 rounded-lg w-96"></div>
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
                            <div className="flex items-center gap-3 mb-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setLocation('/psychiatry-dashboard')}
                                    className="text-white hover:bg-white/20"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Dashboard
                                </Button>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <BarChart className="h-8 w-8" />
                                Treatment Outcomes
                            </h1>
                            <p className="text-white/80 text-lg">
                                Track and analyze patient treatment outcomes and progress
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Report
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Time Range:</span>
                                <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
                                    <TabsList>
                                        <TabsTrigger value="30days">30 Days</TabsTrigger>
                                        <TabsTrigger value="90days">90 Days</TabsTrigger>
                                        <TabsTrigger value="1year">1 Year</TabsTrigger>
                                        <TabsTrigger value="all">All Time</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Status:</span>
                                <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                                    <TabsList>
                                        <TabsTrigger value="all">All</TabsTrigger>
                                        <TabsTrigger value="improved">Improved</TabsTrigger>
                                        <TabsTrigger value="stable">Stable</TabsTrigger>
                                        <TabsTrigger value="declined">Declined</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics?.totalPatients || 0}</div>
                            <p className="text-xs text-muted-foreground">In treatment</p>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Improved</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{metrics?.improved || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {metrics?.totalPatients ? ((metrics.improved / metrics.totalPatients) * 100).toFixed(0) : 0}% of patients
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stable</CardTitle>
                            <Activity className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{metrics?.stable || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {metrics?.totalPatients ? ((metrics.stable / metrics.totalPatients) * 100).toFixed(0) : 0}% of patients
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Declined</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{metrics?.declined || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {metrics?.totalPatients ? ((metrics.declined / metrics.totalPatients) * 100).toFixed(0) : 0}% of patients
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Average Improvement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                                {metrics?.averageImprovement ? `+${metrics.averageImprovement.toFixed(1)}%` : '0%'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Overall patient improvement rate</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Medication Adherence</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {metrics?.medicationAdherence?.toFixed(0) || 0}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Average adherence rate</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Therapy Completion</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {metrics?.therapyCompletion?.toFixed(0) || 0}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Completed therapy sessions</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Patient Outcomes List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            Patient Outcomes
                        </CardTitle>
                        <CardDescription>
                            Detailed outcomes for {patientOutcomes.length} patient{patientOutcomes.length !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {patientOutcomes.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <BarChart className="h-12 w-12 mx-auto mb-2" />
                                <p>No outcome data available for the selected filters</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {patientOutcomes.map((patient) => (
                                    <button
                                        key={patient.id}
                                        type="button"
                                        className="w-full text-left p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                        onClick={() => setLocation(`/patients/${patient.id}`)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-semibold">{patient.name}</h4>
                                                    {getStatusBadge(patient.status)}
                                                </div>
                                                <div className="text-sm text-muted-foreground mb-3">
                                                    <div className="flex items-center gap-4 flex-wrap">
                                                        <span>{patient.diagnosis}</span>
                                                        <span>•</span>
                                                        <span>Started: {new Date(patient.startDate).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span>Last Assessment: {new Date(patient.lastAssessment).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">PHQ-9:</span>
                                                        <span className="text-sm">{patient.phq9Initial} → {patient.phq9Current}</span>
                                                        {getImprovementIcon(patient.phq9Initial - patient.phq9Current)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">GAD-7:</span>
                                                        <span className="text-sm">{patient.gad7Initial} → {patient.gad7Current}</span>
                                                        {getImprovementIcon(patient.gad7Initial - patient.gad7Current)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Improvement:</span>
                                                        <span className={`text-sm font-semibold ${getImprovementColor(patient.improvementPercentage)}`}>
                                                            {patient.improvementPercentage > 0 ? '+' : ''}{patient.improvementPercentage.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <Pill className="h-3 w-3" />
                                                        <span>Adherence: {patient.medicationAdherence}%</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>Therapy Sessions: {patient.therapySessions}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

