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
  Heart, Clock, FileText, Grid3X3, List, LayoutGrid
} from "lucide-react";
import PatientRegistrationModal from "@/components/patient-registration-modal";
import SmartAppointmentScheduler from "@/components/smart-appointment-scheduler";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRole } from "@/components/role-guard";
import type { Patient } from "@shared/schema";

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { user } = useRole();

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const filteredPatients = (patients as Patient[]).filter((patient: Patient) => {
    const matchesSearch = `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getPatientInitials = (patient: Patient) => {
    return `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  };

  const calculateAge = (dateOfBirth: string) => {
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Patient Management</h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base">Manage patient records, appointments, and medical history</p>
        </div>
        {/* Only admin, doctor, and nurse can add new patients */}
        {(user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse') && (
          <Button onClick={() => setShowPatientModal(true)} className="bg-primary hover:bg-primary/90">
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Patient
          </Button>
        )}
      </div>

      {/* Tabs for Patient Records and Appointments */}
      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Patient Records
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Appointments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="mt-4 md:mt-6">
          <div className="space-y-4 md:space-y-6">

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:gap-4 md:space-y-0">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search patients by name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">All Patients</Button>
              <Button variant="outline" size="sm">Active</Button>
              <Button variant="outline" size="sm">Recent Visits</Button>
              
              {/* View Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
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
                <p className="text-2xl font-bold text-green-800">{patients?.length || 0}</p>
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

      {/* Patient Display */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-slate-500 mt-2">Loading patients...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">
            {searchQuery ? "No patients found matching your search." : "No patients registered yet."}
          </p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient: Patient) => (
            <Card key={patient.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-slate-200">
              <Link href={`/patients/${patient.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-14 h-14">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {getPatientInitials(patient)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl text-slate-800">
                        {patient.firstName} {patient.lastName}
                      </CardTitle>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {calculateAge(patient.dateOfBirth)} years old
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    {patient.phone && (
                      <div className="flex items-center text-sm text-slate-600">
                        <Phone className="h-4 w-4 mr-2 text-slate-400" />
                        {patient.phone}
                      </div>
                    )}
                    {patient.address && (
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                        {patient.address.length > 30 ? `${patient.address.substring(0, 30)}...` : patient.address}
                      </div>
                    )}
                  </div>

                  {/* Role-Based Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                    {/* Doctor-specific actions */}
                    {user?.role === 'doctor' && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          New Visit
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Pill className="h-3 w-3 mr-1" />
                          Prescribe
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <FlaskRound className="h-3 w-3 mr-1" />
                          Labs
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Refer
                        </Button>
                      </>
                    )}
                    
                    {/* Nurse-specific actions */}
                    {user?.role === 'nurse' && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Activity className="h-3 w-3 mr-1" />
                          Vitals
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <FlaskRound className="h-3 w-3 mr-1" />
                          Lab Result
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Refer
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                      </>
                    )}
                    
                    {/* Pharmacist-specific actions */}
                    {user?.role === 'pharmacist' && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Pill className="h-3 w-3 mr-1" />
                          Prescriptions
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Heart className="h-3 w-3 mr-1" />
                          Allergies
                        </Button>
                      </>
                    )}
                    
                    {/* Physiotherapist-specific actions */}
                    {user?.role === 'physiotherapist' && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Activity className="h-3 w-3 mr-1" />
                          Assessment
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Sessions
                        </Button>
                      </>
                    )}
                    
                    {/* Admin has access to all actions */}
                    {user?.role === 'admin' && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          Visit
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
                      </>
                    )}
                  </div>

                  {/* View Details Button */}
                  <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Profile
                  </Button>
                </CardContent>
              </Link>
            </Card>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {filteredPatients.map((patient: Patient) => (
                <Card key={patient.id} className="hover:shadow-md transition-all duration-200 cursor-pointer border-slate-200">
                  <Link href={`/patients/${patient.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getPatientInitials(patient)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-slate-800">
                                {patient.firstName} {patient.lastName}
                              </h3>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                            </div>
                            <div className="flex items-center space-x-6 mt-1 text-sm text-slate-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {calculateAge(patient.dateOfBirth)} years old
                              </div>
                              {patient.phone && (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1" />
                                  {patient.phone}
                                </div>
                              )}
                              {patient.address && (
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {patient.address.length > 40 ? `${patient.address.substring(0, 40)}...` : patient.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Role-based quick actions for list view */}
                          {user?.role === 'doctor' && (
                            <>
                              <Button variant="outline" size="sm">
                                <Stethoscope className="h-4 w-4 mr-1" />
                                Visit
                              </Button>
                              <Button variant="outline" size="sm">
                                <Pill className="h-4 w-4 mr-1" />
                                Prescribe
                              </Button>
                            </>
                          )}
                          {user?.role === 'nurse' && (
                            <>
                              <Button variant="outline" size="sm">
                                <Activity className="h-4 w-4 mr-1" />
                                Vitals
                              </Button>
                              <Button variant="outline" size="sm">
                                <FlaskRound className="h-4 w-4 mr-1" />
                                Lab Result
                              </Button>
                            </>
                          )}
                          <Button variant="default" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <PatientRegistrationModal
        open={showPatientModal}
        onOpenChange={setShowPatientModal}
      />
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <SmartAppointmentScheduler />
        </TabsContent>
      </Tabs>
    </div>
  );
}