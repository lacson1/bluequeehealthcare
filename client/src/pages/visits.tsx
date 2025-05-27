import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Calendar, Clock } from "lucide-react";
import { Link } from "wouter";
import type { Visit, Patient } from "@shared/schema";

interface VisitWithPatient extends Visit {
  patient: Patient;
}

export default function Visits() {
  // Note: This would require a modified API endpoint to include patient data
  // For now, we'll show a simple message about implementing this feature

  return (
    <>
      {/* Top Bar */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Visits</h2>
            <p className="text-sm text-slate-500">View all patient visits and appointments</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="mr-2 h-5 w-5" />
              All Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Stethoscope className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-medium text-slate-900">Visit Management</h3>
              <p className="mt-2 text-sm text-slate-500">
                Visit records can be viewed from individual patient profiles. Go to the Patients page to view and record visits.
              </p>
              <Link href="/patients" className="inline-flex items-center px-4 py-2 mt-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                Go to Patients
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
