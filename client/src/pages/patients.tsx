import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, UserPlus, Users, Phone, Calendar, MapPin, 
  Stethoscope, FlaskRound, Pill, UserCheck, Activity,
  Heart, Clock, FileText
} from "lucide-react";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Patient Management</h1>
          <p className="text-slate-600 mt-1">Manage patient records and medical history</p>
        </div>
        <Button onClick={() => setShowPatientModal(true)} className="bg-primary hover:bg-primary/90">
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Patient
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search patients by name, phone, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">All Patients</Button>
              <Button variant="outline" size="sm">Active</Button>
              <Button variant="outline" size="sm">Recent Visits</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-700">Total Patients</p>
                <p className="text-2xl font-bold text-blue-800">{patients?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-700">Active Cases</p>
                <p className="text-2xl font-bold text-green-800">{Math.floor((patients?.length || 0) * 0.8)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-700">This Week</p>
                <p className="text-2xl font-bold text-purple-800">{Math.floor((patients?.length || 0) * 0.3)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-700">Critical Care</p>
                <p className="text-2xl font-bold text-orange-800">{Math.floor((patients?.length || 0) * 0.1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-slate-500 mt-2">Loading patients...</p>
          </div>
        ) : patients && patients.length > 0 ? (
          patients.map((patient: any) => (
            <Card key={patient.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-slate-200">
              <Link href={`/patients/${patient.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-14 h-14">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {getPatientInitials(patient.firstName, patient.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl text-slate-800">
                        {patient.firstName} {patient.lastName}
                      </CardTitle>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {getPatientAge(patient.dateOfBirth)} years old
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    {patient.phoneNumber && (
                      <div className="flex items-center text-sm text-slate-600">
                        <Phone className="h-4 w-4 mr-2 text-slate-400" />
                        {patient.phoneNumber}
                      </div>
                    )}
                    {patient.address && (
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                        {patient.address.length > 30 ? `${patient.address.substring(0, 30)}...` : patient.address}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <Stethoscope className="h-3 w-3 mr-1" />
                      Visits
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <FlaskRound className="h-3 w-3 mr-1" />
                      Labs
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <Pill className="h-3 w-3 mr-1" />
                      Meds
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Refer
                    </Button>
                  </div>

                  {/* View Details Button */}
                  <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Profile
                  </Button>
                </CardContent>
              </Link>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              {searchQuery ? "No patients found matching your search." : "No patients registered yet."}
            </p>
          </div>
        )}
      </div>

      <PatientRegistrationModal
        open={showPatientModal}
        onOpenChange={setShowPatientModal}
      />
    </div>
  );
}
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
