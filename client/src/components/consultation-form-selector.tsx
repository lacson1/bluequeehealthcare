import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ConsultationForm {
  id: number;
  name: string;
  description: string;
  specialistRole: string;
  formStructure: {
    fields: FormField[];
  };
  isActive: boolean;
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'number' | 'date' | 'time' | 'email' | 'phone';
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  section?: string;
  medicalCategory?: 'symptoms' | 'vitals' | 'history' | 'examination' | 'diagnosis' | 'treatment' | 'followup';
}

interface ConsultationFormSelectorProps {
  patientId: number;
  visitId?: number;
  onFormSubmit?: (data: any) => void;
}

export default function ConsultationFormSelector({ 
  patientId, 
  visitId, 
  onFormSubmit 
}: ConsultationFormSelectorProps) {
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available consultation forms
  const { data: forms = [], isLoading: formsLoading } = useQuery<ConsultationForm[]>({
    queryKey: ['/api/consultation-forms'],
  });

  // Fetch consultation history for this patient
  const { data: consultationHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/patients', patientId, 'consultation-records'],
  });

  // Get selected form details
  const selectedForm = forms.find(form => form.id === selectedFormId);

  // Submit consultation record mutation
  const submitConsultationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/consultation-records', {
        patientId,
        visitId,
        formId: selectedFormId,
        formData: data,
        consultationDate: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Consultation Recorded",
        description: "Patient consultation has been successfully recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'consultation-records'] });
      setFormData({});
      setSelectedFormId(null);
      onFormSubmit?.(formData);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save consultation record.",
        variant: "destructive",
      });
    },
  });

  // Validate form data
  const validateFormData = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!selectedForm) return false;

    selectedForm.formStructure.fields.forEach(field => {
      const value = formData[field.id];
      
      if (field.required && (!value || value.toString().trim() === '')) {
        errors[field.id] = `${field.label} is required`;
      }
      
      if (field.validation) {
        if (field.validation.minLength && value && value.length < field.validation.minLength) {
          errors[field.id] = `${field.label} must be at least ${field.validation.minLength} characters`;
        }
        if (field.validation.maxLength && value && value.length > field.validation.maxLength) {
          errors[field.id] = `${field.label} must be no more than ${field.validation.maxLength} characters`;
        }
        if (field.validation.min && value && parseFloat(value) < field.validation.min) {
          errors[field.id] = `${field.label} must be at least ${field.validation.min}`;
        }
        if (field.validation.max && value && parseFloat(value) > field.validation.max) {
          errors[field.id] = `${field.label} must be no more than ${field.validation.max}`;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateFormData()) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitConsultationMutation.mutate(formData);
  };

  // Render form field based on type
  const renderFormField = (field: FormField) => {
    const value = formData[field.id] || '';
    const hasError = validationErrors[field.id];

    const updateValue = (newValue: any) => {
      setFormData(prev => ({ ...prev, [field.id]: newValue }));
      if (hasError) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field.id];
          return newErrors;
        });
      }
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? 'border-red-500' : ''}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={hasError ? 'border-red-500' : ''}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            className={hasError ? 'border-red-500' : ''}
          />
        );
      
      case 'time':
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            className={hasError ? 'border-red-500' : ''}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={hasError ? 'border-red-500' : ''}
          />
        );
      
      case 'select':
        return (
          <Select value={value} onValueChange={updateValue}>
            <SelectTrigger className={hasError ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.id}_${index}`}
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => updateValue(e.target.value)}
                  className="text-blue-600"
                />
                <label htmlFor={`${field.id}_${index}`} className="text-sm">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${field.id}_${index}`}
                  value={option}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      updateValue([...currentValues, option]);
                    } else {
                      updateValue(currentValues.filter((v: string) => v !== option));
                    }
                  }}
                  className="text-blue-600"
                />
                <label htmlFor={`${field.id}_${index}`} className="text-sm">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (formsLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading consultation forms...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Selection - Create New Consultation */}
      {!selectedFormId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create New Consultation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {forms.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No consultation forms available. Create forms in the Form Builder first.
                </p>
              ) : (
                forms.filter(form => form.isActive).map((form) => (
                  <Card key={form.id} className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setSelectedFormId(form.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{form.name}</h4>
                          <p className="text-sm text-gray-600">{form.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{form.specialistRole}</Badge>
                            <span className="text-xs text-gray-500">
                              {form.formStructure.fields.length} fields
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Use Form
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Form Display */}
      {selectedForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedForm.name}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFormId(null);
                  setFormData({});
                  setValidationErrors({});
                }}
              >
                Change Form
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{selectedForm.description}</p>
            
            {/* Form Fields */}
            <div className="space-y-4">
              {selectedForm.formStructure.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                    {field.medicalCategory && (
                      <Badge variant="secondary" className="text-xs">
                        {field.medicalCategory}
                      </Badge>
                    )}
                  </Label>
                  {renderFormField(field)}
                  {validationErrors[field.id] && (
                    <p className="text-sm text-red-600">{validationErrors[field.id]}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={submitConsultationMutation.isPending}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitConsultationMutation.isPending ? 'Saving...' : 'Save Consultation'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consultation History - Continuous Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Consultation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Loading consultation history...
            </div>
          ) : (consultationHistory as any[]).length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No consultations recorded yet for this patient.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto pr-2">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
                
                <div className="space-y-6">
                  {(consultationHistory as any[]).map((consultation: any, index: number) => (
                    <div key={consultation.id} className="relative flex items-start">
                      {/* Timeline dot */}
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      
                      {/* Consultation content */}
                      <div className="ml-4 flex-1">
                        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-lg text-gray-900">
                                {forms.find(f => f.id === consultation.formId)?.name || 'Unknown Form'}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  #{consultation.id}
                                </Badge>
                                <Badge variant="secondary">
                                  {new Date(consultation.consultationDate).toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Consultation details */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-600">
                                  <strong>Date:</strong> {new Date(consultation.consultationDate).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </span>
                                <span className="text-gray-600">
                                  <strong>Time:</strong> {new Date(consultation.consultationDate).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-600">
                                <strong>Form Type:</strong> {forms.find(f => f.id === consultation.formId)?.specialistRole || 'General'}
                              </div>
                              
                              {/* Form data preview */}
                              {consultation.formData && Object.keys(consultation.formData).length > 0 && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Key Information:</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                    {Object.entries(consultation.formData).slice(0, 4).map(([key, value]: [string, any]) => (
                                      <div key={key} className="flex">
                                        <span className="font-medium text-gray-600 mr-2">{key}:</span>
                                        <span className="text-gray-800 truncate">
                                          {Array.isArray(value) ? value.join(', ') : String(value).substring(0, 50)}
                                          {String(value).length > 50 && '...'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  {Object.keys(consultation.formData).length > 4 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                      +{Object.keys(consultation.formData).length - 4} more fields recorded
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* End of timeline indicator */}
                <div className="relative flex items-center mt-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  </div>
                  <div className="ml-4 text-sm text-gray-500">
                    Start of consultation history
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}