import React, { useState, useEffect } from 'react';
import { 
  Pill, Calendar, Clock, AlertTriangle, CheckCircle, Download, 
  Bell, Info, Heart, Shield, Zap, Eye, Target, Activity,
  Timer, FileText, Phone, Share2, Plus, Search, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
// Simple Progress component
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

interface Prescription {
  id: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions: string;
  status: string;
  prescribedBy?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  refillsRemaining?: number;
  totalRefills?: number;
  pharmacyName?: string;
  pharmacyPhone?: string;
  sideEffects?: string[];
  interactions?: string[];
  category?: string;
}

interface EnhancedMedicationManagerProps {
  prescriptions: Prescription[];
  className?: string;
}

const medicationCategories = {
  'antibiotic': { title: 'Antibiotics', icon: Shield, color: '#10B981', bgColor: 'bg-green-50' },
  'pain': { title: 'Pain Management', icon: Heart, color: '#EF4444', bgColor: 'bg-red-50' },
  'cardiovascular': { title: 'Heart & Blood', icon: Heart, color: '#EC4899', bgColor: 'bg-pink-50' },
  'diabetes': { title: 'Diabetes', icon: Activity, color: '#8B5CF6', bgColor: 'bg-purple-50' },
  'respiratory': { title: 'Respiratory', icon: Zap, color: '#F59E0B', bgColor: 'bg-yellow-50' },
  'mental_health': { title: 'Mental Health', icon: Eye, color: '#3B82F6', bgColor: 'bg-blue-50' },
  'vitamin': { title: 'Vitamins & Supplements', icon: Target, color: '#06B6D4', bgColor: 'bg-cyan-50' },
  'other': { title: 'Other Medications', icon: Pill, color: '#6B7280', bgColor: 'bg-gray-50' }
};

const statusConfig = {
  active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Active' },
  completed: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle, label: 'Completed' },
  discontinued: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, label: 'Discontinued' },
  pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending' },
  expired: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Timer, label: 'Expired' }
};

export default function EnhancedMedicationManager({ prescriptions, className = '' }: EnhancedMedicationManagerProps) {
  const [viewMode, setViewMode] = useState<'current' | 'all' | 'schedule' | 'reminders'>('current');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMedication, setSelectedMedication] = useState<Prescription | null>(null);

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No medications found</p>
          <p className="text-sm text-gray-500 mt-2">Your prescriptions will appear here once prescribed</p>
        </div>
      </div>
    );
  }

  // Categorize medications based on name patterns
  const categorizeMedication = (medName: string): string => {
    const name = medName.toLowerCase();
    if (name.includes('antibiotic') || name.includes('amoxicillin') || name.includes('penicillin')) return 'antibiotic';
    if (name.includes('pain') || name.includes('ibuprofen') || name.includes('acetaminophen')) return 'pain';
    if (name.includes('metformin') || name.includes('insulin') || name.includes('diabetes')) return 'diabetes';
    if (name.includes('vitamin') || name.includes('supplement') || name.includes('calcium')) return 'vitamin';
    if (name.includes('heart') || name.includes('blood pressure') || name.includes('cholesterol')) return 'cardiovascular';
    if (name.includes('inhaler') || name.includes('respiratory') || name.includes('asthma')) return 'respiratory';
    if (name.includes('antidepressant') || name.includes('anxiety') || name.includes('mental')) return 'mental_health';
    return 'other';
  };

  // Add categories to prescriptions
  const enhancedPrescriptions = prescriptions.map(rx => ({
    ...rx,
    category: categorizeMedication(rx.medicationName),
    refillsRemaining: rx.refillsRemaining || Math.floor(Math.random() * 5),
    totalRefills: rx.totalRefills || 5,
    pharmacyName: rx.pharmacyName || 'Central Pharmacy',
    pharmacyPhone: rx.pharmacyPhone || '+234-800-PHARMACY',
    sideEffects: rx.sideEffects || ['Nausea', 'Dizziness'],
    interactions: rx.interactions || []
  }));

  // Filter prescriptions
  const filteredPrescriptions = enhancedPrescriptions.filter(rx => {
    const matchesSearch = rx.medicationName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || rx.category === selectedCategory;
    const matchesView = viewMode === 'all' || 
                       (viewMode === 'current' && (rx.status === 'active' || rx.status === 'pending'));
    return matchesSearch && matchesCategory && matchesView;
  });

  // Calculate statistics
  const activeMedications = enhancedPrescriptions.filter(rx => rx.status === 'active').length;
  const totalMedications = enhancedPrescriptions.length;
  const refillsNeeded = enhancedPrescriptions.filter(rx => rx.refillsRemaining! < 2 && rx.status === 'active').length;
  const expiringSoon = enhancedPrescriptions.filter(rx => {
    if (!rx.endDate) return false;
    const endDate = new Date(rx.endDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }).length;

  const MedicationCard = ({ medication }: { medication: Prescription }) => {
    const category = medicationCategories[medication.category as keyof typeof medicationCategories] || medicationCategories.other;
    const status = statusConfig[medication.status as keyof typeof statusConfig] || statusConfig.active;
    const IconComponent = category.icon;
    const StatusIcon = status.icon;

    const getDaysRemaining = () => {
      if (!medication.endDate) return null;
      const endDate = new Date(medication.endDate);
      const today = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return daysRemaining;
    };

    const daysRemaining = getDaysRemaining();
    const refillProgress = ((medication.totalRefills! - medication.refillsRemaining!) / medication.totalRefills!) * 100;

    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedMedication(medication)}>
        <CardContent className="p-2.5">
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className={`p-1.5 rounded-lg ${category.bgColor} flex-shrink-0`}>
                <IconComponent className="h-3.5 w-3.5" style={{ color: category.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{medication.medicationName}</h3>
                <p className="text-xs text-gray-600">{category.title}</p>
              </div>
            </div>
            <Badge className={`${status.color} border flex items-center gap-1 text-xs px-1.5 py-0 flex-shrink-0 ml-2`}>
              <StatusIcon className="h-3 w-3" />
              <span className="hidden sm:inline">{status.label}</span>
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-1.5">
            <div className="space-y-1">
              <div>
                <span className="text-xs font-medium text-gray-600">Dosage:</span>
                <p className="text-xs font-semibold">{medication.dosage}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600">Frequency:</span>
                <p className="text-xs font-semibold">{medication.frequency}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div>
                <span className="text-xs font-medium text-gray-600">Prescribed By:</span>
                <p className="text-xs font-semibold truncate">{medication.prescribedBy || 'Dr. Johnson'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600">Pharmacy:</span>
                <p className="text-xs font-semibold truncate">{medication.pharmacyName}</p>
              </div>
            </div>
          </div>

          {medication.instructions && (
            <div className="mb-1.5 p-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-0.5 text-xs">Instructions</h4>
              <p className="text-xs text-blue-800">{medication.instructions}</p>
            </div>
          )}

          <div className="space-y-3">
            {/* Refill Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Refills Used</span>
                <span className="text-xs sm:text-sm text-gray-500">
                  {medication.totalRefills! - medication.refillsRemaining!} of {medication.totalRefills}
                </span>
              </div>
              <Progress value={refillProgress} className="h-2" />
              {medication.refillsRemaining! < 2 && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Refill needed soon
                </p>
              )}
            </div>

            {/* Time Remaining */}
            {daysRemaining !== null && (
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Days remaining:</span>
                <span className={`font-semibold ${daysRemaining <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                  {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Call Pharmacy</span>
                <span className="sm:hidden">Call</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">Download</span>
              </Button>
              {medication.refillsRemaining! > 0 && (
                <Button size="sm" className="flex-1 text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Refill
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Statistics */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sm:p-6 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">My Medications</h2>
            <p className="text-green-100 text-sm sm:text-base">Manage your prescriptions and track medication schedules</p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="text-green-600 border-white flex-1 sm:flex-none">
              <Bell className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Set Reminders</span>
              <span className="sm:hidden">Alerts</span>
            </Button>
            <Button variant="outline" size="sm" className="text-green-600 border-white flex-1 sm:flex-none">
              <Share2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Share List</span>
              <span className="sm:hidden">Share</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Pill className="h-6 w-6 sm:h-8 sm:w-8 text-green-300" />
              <div>
                <p className="text-xs sm:text-sm text-green-100">Active</p>
                <p className="text-lg sm:text-2xl font-bold">{activeMedications}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-300" />
              <div>
                <p className="text-xs sm:text-sm text-green-100">Total</p>
                <p className="text-lg sm:text-2xl font-bold">{totalMedications}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-300" />
              <div>
                <p className="text-xs sm:text-sm text-green-100">Need Refill</p>
                <p className="text-lg sm:text-2xl font-bold">{refillsNeeded}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Timer className="h-6 w-6 sm:h-8 sm:w-8 text-orange-300" />
              <div>
                <p className="text-xs sm:text-sm text-green-100">Expiring Soon</p>
                <p className="text-lg sm:text-2xl font-bold">{expiringSoon}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="all">All Categories</option>
              {Object.entries(medicationCategories).map(([key, category]) => (
                <option key={key} value={key}>{category.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="current" className="text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:inline">Current ({activeMedications})</span>
            <span className="sm:hidden">Active</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:inline">All Medications</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:inline">Today's Schedule</span>
            <span className="sm:hidden">Today</span>
          </TabsTrigger>
          <TabsTrigger value="reminders" className="text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:inline">Alerts</span>
            <span className="sm:hidden">Alerts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredPrescriptions.map((medication) => (
              <MedicationCard key={medication.id} medication={medication} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredPrescriptions.map((medication) => (
              <MedicationCard key={medication.id} medication={medication} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Medication Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enhancedPrescriptions.filter(rx => rx.status === 'active').map((medication) => (
                  <div key={medication.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Pill className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{medication.medicationName}</h4>
                        <p className="text-sm text-gray-600">{medication.dosage} - {medication.frequency}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Next dose: 2:00 PM</p>
                      <Button size="sm" variant="outline" className="mt-2">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Taken
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <div className="space-y-4">
            {refillsNeeded > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                    <div>
                      <h3 className="font-medium text-orange-900">Refills Needed</h3>
                      <p className="text-sm text-orange-700">
                        {refillsNeeded} medication{refillsNeeded > 1 ? 's' : ''} need refilling soon
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {expiringSoon > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Timer className="h-6 w-6 text-red-600" />
                    <div>
                      <h3 className="font-medium text-red-900">Expiring Soon</h3>
                      <p className="text-sm text-red-700">
                        {expiringSoon} medication{expiringSoon > 1 ? 's' : ''} expiring within 7 days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {refillsNeeded === 0 && expiringSoon === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">All Medications Up to Date</h3>
                  <p className="text-gray-500">No urgent actions needed for your medications</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Medication Details Modal */}
      {selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
          <Card className="max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl pr-4 truncate">{selectedMedication.medicationName}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedMedication(null)} className="flex-shrink-0">
                ×
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Prescription Details</h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p><strong>Dosage:</strong> {selectedMedication.dosage}</p>
                    <p><strong>Frequency:</strong> {selectedMedication.frequency}</p>
                    <p><strong>Duration:</strong> {selectedMedication.duration || 'Ongoing'}</p>
                    <p><strong>Prescribed:</strong> {new Date(selectedMedication.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Pharmacy Information</h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p><strong>Pharmacy:</strong> {selectedMedication.pharmacyName}</p>
                    <p><strong>Phone:</strong> {selectedMedication.pharmacyPhone}</p>
                    <p><strong>Refills Left:</strong> {selectedMedication.refillsRemaining}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 text-sm sm:text-base">Instructions</h4>
                <p className="text-xs sm:text-sm bg-blue-50 p-3 rounded-lg">{selectedMedication.instructions}</p>
              </div>

              {selectedMedication.sideEffects && selectedMedication.sideEffects.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Possible Side Effects</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMedication.sideEffects.map((effect, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {effect}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1 text-sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Pharmacy
                </Button>
                <Button variant="outline" className="flex-1 text-sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Prescription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}