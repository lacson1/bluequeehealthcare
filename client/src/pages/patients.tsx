import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Users } from "lucide-react";
import PatientRegistrationModal from "@/components/patient-registration-modal";
import type { Patient } from "@shared/schema";

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPatientModal, setShowPatientModal] = useState(false);

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients", searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/patients${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""}`);
      if (!response.ok) throw new Error("Failed to fetch patients");
      return response.json();
    },
  });

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getPatientAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <>
      {/* Top Bar */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Patients</h2>
            <p className="text-sm text-slate-500">Manage patient records and information</p>
          </div>
          <Button onClick={() => setShowPatientModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Input
              type="text"
              placeholder="Search patients by name or phone..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Patients List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              All Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4 p-4">
                    <div className="rounded-full bg-slate-200 h-12 w-12"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : patients && patients.length > 0 ? (
              <div className="space-y-4">
                {patients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/patients/${patient.id}`}
                    className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {getPatientInitials(patient.firstName, patient.lastName)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">
                        {patient.firstName} {patient.lastName}
                      </h4>
                      <p className="text-sm text-slate-500">
                        ID: HC{patient.id.toString().padStart(6, "0")} | Age: {getPatientAge(patient.dateOfBirth)} | {patient.gender}
                      </p>
                      <p className="text-sm text-slate-500">
                        Phone: {patient.phone} {patient.email && `| Email: ${patient.email}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        Registered: {new Date(patient.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-lg font-medium text-slate-900">
                  {searchQuery ? "No patients found" : "No patients yet"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {searchQuery
                    ? "Try adjusting your search terms."
                    : "Get started by registering your first patient."}
                </p>
                {!searchQuery && (
                  <Button
                    className="mt-4"
                    onClick={() => setShowPatientModal(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add First Patient
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal */}
      <PatientRegistrationModal
        open={showPatientModal}
        onOpenChange={setShowPatientModal}
      />
    </>
  );
}
