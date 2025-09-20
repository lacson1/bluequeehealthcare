import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLabResultSchema, type InsertLabResult, type Patient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import LabTestAutocomplete from "./lab-test-autocomplete";

interface LabResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId?: number;
}

export default function LabResultModal({
  open,
  onOpenChange,
  patientId,
}: LabResultModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(patientId);
  const [selectedLabTest, setSelectedLabTest] = useState<{name: string; category: string; referenceRange: string} | null>(null);

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: !patientId, // Only fetch if patientId is not provided
  });

  const form = useForm<Omit<InsertLabResult, "patientId">>({
    resolver: zodResolver(insertLabResultSchema.omit({ patientId: true })),
    defaultValues: {
      testName: "",
      result: "",
      normalRange: "",
      status: "pending",
      notes: "",
    },
  });

  const addLabResultMutation = useMutation({
    mutationFn: async (data: InsertLabResult) => {
      const response = await apiRequest("POST", `/api/patients/${data.patientId}/labs`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      if (selectedPatientId) {
        queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatientId, "labs"] });
      }
      toast({
        title: "Success",
        description: "Lab result added successfully!",
      });
      form.reset();
      setSelectedPatientId(undefined);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add lab result. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLabTestSelect = (test: {name: string; category: string; referenceRange: string}) => {
    setSelectedLabTest(test);
    form.setValue("testName", test.name);
  };

  const handleLabTestAutoFill = (test: {name: string; category: string; referenceRange: string}) => {
    // Auto-fill the normal range when a test is selected
    form.setValue("normalRange", test.referenceRange);
  };

  const onSubmit = (data: Omit<InsertLabResult, "patientId">) => {
    if (!selectedPatientId) {
      toast({
        title: "Error",
        description: "Please select a patient.",
        variant: "destructive",
      });
      return;
    }

    addLabResultMutation.mutate({
      ...data,
      patientId: selectedPatientId,
    });
  };

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Lab Result</DialogTitle>
          <DialogDescription>
            Add a new lab result for a patient.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient Selection */}
            {!patientId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Patient</label>
                <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={patientSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedPatient
                        ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                        : "Select patient..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search patient..." />
                      <CommandEmpty>No patient found.</CommandEmpty>
                      <CommandGroup>
                        {patients?.map((patient) => (
                          <CommandItem
                            key={patient.id}
                            onSelect={() => {
                              setSelectedPatientId(patient.id);
                              setPatientSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedPatientId === patient.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {patient.firstName} {patient.lastName} - {patient.phone}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Smart Lab Test Selection with Auto-Fill */}
            <div className="space-y-4">
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Lab Test Name (Smart Auto-Fill Enabled)
                </FormLabel>
                <LabTestAutocomplete
                  value={selectedLabTest}
                  onSelect={handleLabTestSelect}
                  onAutoFill={handleLabTestAutoFill}
                  placeholder="Search lab tests (e.g., CBC, Blood Glucose, Malaria Test)..."
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">
                  ✨ Select a standardized test to automatically fill reference ranges and ensure data consistency.
                </p>
              </FormItem>
            </div>

            {/* Lab Result Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="abnormal">Abnormal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Result</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Enter the test result..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="normalRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Normal Range</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., 70-100 mg/dL" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder="Additional notes or observations..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addLabResultMutation.isPending}
              >
                {addLabResultMutation.isPending ? "Adding..." : "Add Lab Result"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
