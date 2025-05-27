import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskRound } from "lucide-react";
import { Link } from "wouter";

export default function LabResults() {
  return (
    <>
      {/* Top Bar */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Lab Results</h2>
            <p className="text-sm text-slate-500">Manage laboratory test results</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FlaskRound className="mr-2 h-5 w-5" />
              All Lab Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FlaskRound className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-medium text-slate-900">Lab Results Management</h3>
              <p className="mt-2 text-sm text-slate-500">
                Lab results can be viewed and added from individual patient profiles. Go to the Patients page to manage lab results.
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
