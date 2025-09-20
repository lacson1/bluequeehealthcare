import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  TestTube, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User,
  Calendar,
  FileText,
  TrendingUp,
  Activity
} from "lucide-react";
import { format } from "date-fns";

const labResultSchema = z.object({
  patientId: z.number().min(1, "Patient ID is required"),
  testName: z.string().min(1, "Test name is required"),
  result: z.string().min(1, "Result value is required"),
  normalRange: z.string().optional(),
  status: z.enum(["completed", "pending", "abnormal", "critical", "normal"]),
  notes: z.string().optional(),
  testDate: z.string().optional(),
  units: z.string().optional(),
  interpretation: z.string().optional(),
  recommendations: z.string().optional()
});

interface LabResultEntryProps {
  patientId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
}

export default function LabResultEntryEnhanced({ 
  patientId, 
  onSuccess, 
  onCancel, 
  initialData 
}: LabResultEntryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch patients for selection
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients']
  });

  // Fetch lab tests for autocomplete
  const { data: labTests = [] } = useQuery({
    queryKey: ['/api/lab-tests']
  });

  const form = useForm({
    resolver: zodResolver(labResultSchema),
    defaultValues: {
      patientId: patientId || initialData?.patientId || 0,
      testName: initialData?.testName || "",
      result: initialData?.result || "",
      normalRange: initialData?.normalRange || "",
      status: initialData?.status || "completed",
      notes: initialData?.notes || "",
      testDate: initialData?.testDate || new Date().toISOString().split('T')[0],
      units: initialData?.units || "",
      interpretation: initialData?.interpretation || "",
      recommendations: initialData?.recommendations || ""
    }
  });

  // Save lab result mutation
  const saveResultMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = initialData?.id 
        ? `/api/lab-results/${initialData.id}` 
        : '/api/lab-results/save';
      const method = initialData?.id ? 'PATCH' : 'POST';
      
      return apiRequest(endpoint, method, {
        ...data,
        id: initialData?.id
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-results/reviewed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      
      toast({
        title: initialData?.id ? "Lab result updated successfully" : "Lab result saved successfully",
        description: `${form.getValues('testName')} result has been recorded`,
        duration: 4000
      });
      
      // Show AI analysis if available
      if (response.aiAnalysis) {
        const analysis = response.aiAnalysis;
        toast({
          title: "AI Clinical Analysis Available",
          description: `Status: ${analysis.status} | Priority: ${analysis.urgency}`,
          duration: 6000
        });
      }
      
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Save lab result error:', error);
      toast({
        title: "Failed to save lab result",
        description: error.message || "Please check your input and try again",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await saveResultMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'abnormal': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const selectedPatient = patients.find(p => p.id === form.watch('patientId'));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TestTube className="w-6 h-6 text-blue-600" />
            </div>
            {initialData?.id ? 'Update Lab Result' : 'New Lab Result Entry'}
          </CardTitle>
          <CardDescription>
            {initialData?.id 
              ? 'Update the laboratory test result and analysis'
              : 'Enter laboratory test results with clinical interpretation'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Patient Info Display */}
          {selectedPatient && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      DOB: {format(new Date(selectedPatient.dateOfBirth), 'PP')} | 
                      Phone: {selectedPatient.phone}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Patient ID: {selectedPatient.id}
                </Badge>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Selection */}
                {!patientId && (
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Patient
                        </FormLabel>
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id.toString()}>
                                {patient.firstName} {patient.lastName} - {patient.phone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Test Name */}
                <FormField
                  control={form.control}
                  name="testName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <TestTube className="w-4 h-4" />
                        Test Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., Complete Blood Count"
                          list="lab-tests"
                        />
                      </FormControl>
                      <datalist id="lab-tests">
                        {labTests.slice(0, 20).map((test: any) => (
                          <option key={test.id} value={test.name} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Test Date */}
                <FormField
                  control={form.control}
                  name="testDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Test Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Status
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="completed">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Completed
                            </div>
                          </SelectItem>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-yellow-600" />
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="normal">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                              Normal
                            </div>
                          </SelectItem>
                          <SelectItem value="abnormal">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                              Abnormal
                            </div>
                          </SelectItem>
                          <SelectItem value="critical">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              Critical
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Result Value */}
                <FormField
                  control={form.control}
                  name="result"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Result Value
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Enter test result value and details"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Normal Range */}
                <FormField
                  control={form.control}
                  name="normalRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Normal Range</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., 4.5-11.0 x10^9/L"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Units */}
                <FormField
                  control={form.control}
                  name="units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Units</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., mg/dL, mmol/L"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Clinical Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Clinical Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Additional clinical observations and notes"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Clinical Interpretation */}
              <FormField
                control={form.control}
                name="interpretation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinical Interpretation</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Clinical interpretation of the results"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recommendations */}
              <FormField
                control={form.control}
                name="recommendations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommendations</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Clinical recommendations based on results"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status Preview */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Current Status:</span>
                <Badge className={`${getStatusColor(form.watch('status'))} font-medium`}>
                  {form.watch('status')?.toUpperCase()}
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={isSubmitting || saveResultMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting || saveResultMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {initialData?.id ? 'Update Result' : 'Save Result'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}