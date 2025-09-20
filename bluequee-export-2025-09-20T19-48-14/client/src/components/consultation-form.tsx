import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, Clock, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import SmartFormField from "@/components/smart-form-field";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface ConsultationForm {
  id: number;
  name: string;
  description: string;
  specialistRole: string;
  formSchema: {
    fields: FormField[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

interface ConsultationFormProps {
  patientId: number;
  onComplete?: () => void;
}

export default function ConsultationForm({ patientId, onComplete }: ConsultationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedForm, setSelectedForm] = useState<ConsultationForm | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Fetch available consultation forms
  const { data: forms = [], isLoading: formsLoading } = useQuery<ConsultationForm[]>({
    queryKey: ['/api/consultation-forms'],
  });

  // Create dynamic schema based on selected form
  const createFormSchema = (fields: FormField[]) => {
    const schemaFields: Record<string, any> = {};
    
    fields.forEach(field => {
      if (field.required) {
        schemaFields[field.id] = z.string().min(1, `${field.label} is required`);
      } else {
        schemaFields[field.id] = z.string().optional();
      }
    });
    
    return z.object(schemaFields);
  };

  // Initialize form with dynamic schema
  const form = useForm({
    resolver: selectedForm ? zodResolver(createFormSchema(selectedForm.formSchema.fields)) : undefined,
    defaultValues: formData,
  });

  // Submit consultation record
  const submitConsultationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/patients/${patientId}/consultation-records`, {
        method: 'POST',
        body: {
          formId: selectedForm!.id,
          patientId,
          data: data
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Consultation Recorded",
        description: "Patient consultation has been successfully recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'consultation-records'] });
      if (onComplete) onComplete();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save consultation record.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedForm(null);
    setFormData({});
    form.reset();
  };

  const onSubmit = (data: any) => {
    submitConsultationMutation.mutate(data);
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
        return (
          <FormField
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={field.placeholder || field.label}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'textarea':
        return (
          <FormField
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={field.placeholder || field.label}
                    rows={3}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'radio':
        return (
          <FormField
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={formField.onChange}
                    value={formField.value}
                    className="space-y-2"
                  >
                    {field.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                        <Label htmlFor={`${field.id}-${index}`} className="text-sm">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'checkbox':
        return (
          <FormField
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <div className="space-y-2">
                  {field.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${field.id}-${index}`}
                        checked={(formField.value || []).includes(option)}
                        onCheckedChange={(checked) => {
                          const currentValues = formField.value || [];
                          if (checked) {
                            formField.onChange([...currentValues, option]);
                          } else {
                            formField.onChange(currentValues.filter((v: string) => v !== option));
                          }
                        }}
                      />
                      <Label htmlFor={`${field.id}-${index}`} className="text-sm">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'select':
        return (
          <FormField
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <Select onValueChange={formField.onChange} value={formField.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || "Select an option"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  if (formsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading specialty assessments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Specialty Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Choose a specialty assessment to record patient evaluation:
            </p>
            <div className="grid gap-3">
              {forms.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No consultation forms available</p>
                  <p className="text-sm">Contact your administrator to create consultation forms.</p>
                </div>
              ) : (
                forms.map((form) => (
                  <Card
                    key={form.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedForm(form)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{form.name}</h4>
                          <p className="text-sm text-gray-600">{form.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {form.specialistRole}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {form.formSchema.fields.length} fields
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {selectedForm.name}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetForm}
          >
            Change Form
          </Button>
        </CardTitle>
        {selectedForm.description && (
          <p className="text-gray-600">{selectedForm.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {selectedForm.formSchema.fields.map((field) => (
                <div key={field.id}>
                  {renderField(field)}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="submit"
                disabled={submitConsultationMutation.isPending}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-1" />
                {submitConsultationMutation.isPending ? 'Saving...' : 'Save Consultation'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}