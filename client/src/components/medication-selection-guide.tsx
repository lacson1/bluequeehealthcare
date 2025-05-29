import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Pill, 
  User, 
  FileText,
  Shield,
  Clock
} from "lucide-react";

interface MedicationSelectionGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MedicationSelectionGuide({ isOpen, onClose }: MedicationSelectionGuideProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Medication Selection Protocol
              </CardTitle>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-xl font-semibold"
              >
                ×
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Step-by-Step Protocol */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Step 1: Prescription Verification */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Step 1: Prescription Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Verify prescription ID and patient name</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Check prescribing doctor's signature</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Confirm prescription date (not expired)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Validate controlled substance requirements</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Medication Identification */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Pill className="w-5 h-5 text-purple-600" />
                    Step 2: Medication Identification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Match exact medication name</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Verify strength/dosage (e.g., 500mg)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Confirm dosage form (tablet, capsule, syrup)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Check generic vs brand name requirements</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: Patient Safety Check */}
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-600" />
                    Step 3: Patient Safety Check
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <span className="text-sm">Review patient allergies</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <span className="text-sm">Check contraindications</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <span className="text-sm">Verify age-appropriate dosing</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <span className="text-sm">Review drug interactions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 4: Stock Verification */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    Step 4: Stock Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Confirm sufficient quantity available</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Check expiration dates</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Verify proper storage conditions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Record batch numbers if required</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Reference Guide */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Quick Reference: Medication Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <Badge variant="outline" className="w-3 h-3 rounded-full bg-blue-100"></Badge>
                      Brand Name Info
                    </h4>
                    <ul className="text-xs space-y-1 text-gray-600">
                      <li>• Primary medication name</li>
                      <li>• Strength badge (e.g., 500mg)</li>
                      <li>• Manufacturer details</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <Info className="w-3 h-3 text-blue-500" />
                      Indications (Blue)
                    </h4>
                    <ul className="text-xs space-y-1 text-gray-600">
                      <li>• What conditions it treats</li>
                      <li>• Approved usage guidelines</li>
                      <li>• Therapeutic categories</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      Contraindications (Red)
                    </h4>
                    <ul className="text-xs space-y-1 text-gray-600">
                      <li>• When NOT to use</li>
                      <li>• Patient safety warnings</li>
                      <li>• Drug interaction alerts</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Common Medication Categories */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Common Medication Categories in Your Clinic</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                  <Badge variant="secondary" className="justify-center py-2">Antibiotics</Badge>
                  <Badge variant="secondary" className="justify-center py-2">Pain Relief</Badge>
                  <Badge variant="secondary" className="justify-center py-2">Antihypertensive</Badge>
                  <Badge variant="secondary" className="justify-center py-2">Vitamins</Badge>
                  <Badge variant="secondary" className="justify-center py-2">Antacids</Badge>
                  <Badge variant="secondary" className="justify-center py-2">Antimalarials</Badge>
                  <Badge variant="secondary" className="justify-center py-2">Respiratory</Badge>
                  <Badge variant="secondary" className="justify-center py-2">Dermatological</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Critical Safety Alerts */}
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Critical Safety Reminder:</strong> Always double-check the "Five Rights" - 
                Right Patient, Right Medication, Right Dose, Right Route, Right Time. 
                When in doubt, consult with the prescribing doctor or senior pharmacist.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end pt-4">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got It - Start Dispensing
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}