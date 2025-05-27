import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPrescriptionSchema, type InsertPrescription, type Patient, type Medicine } from "@shared/schema";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId?: number;
  visitId?: number;
}

export default function PrescriptionModal({
  open,
  onOpenChange,
  patientId,
  visitId,
}: PrescriptionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [medicineSearchOpen, setMedicineSearchOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(patientId);
  const [selectedMedicineId, setSelectedMedicineId] = useState<number | undefined>();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: !patientId, // Only fetch if patientId is not provided
  });

  const { data: medicines } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });

  const form = useForm<Omit<InsertPrescription, "patientId" | "medicineId">>({
    resolver: zodResolver(insertPrescriptionSchema.omit({ patientId: true, medicineId: true })),
    defaultValues: {
      visitId: visitId || undefined,
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      prescribedBy: "Dr. Adebayo",
      status: "active",
      startDate: new Date(),
      endDate: undefined,
    },
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: InsertPrescription) => {
      const response = await apiRequest("POST", `/api/patients/${data.patientId}/prescriptions`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      if (selectedPatientId) {
        queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatientId, "prescriptions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/patients", selectedPatientId, "prescriptions", "active"] });
      }
      if (visitId) {
        queryClient.invalidateQueries({ queryKey: ["/api/visits", visitId, "prescriptions"] });
      }
      toast({
        title: "Success",
        description: "Prescription created successfully!",
      });
      form.reset();
      setSelectedPatientId(undefined);
      setSelectedMedicineId(undefined);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create prescription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertPrescription, "patientId" | "medicineId">) => {
    if (!selectedPatientId) {
      toast({
        title: "Error",
        description: "Please select a patient.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMedicineId) {
      toast({
        title: "Error",
        description: "Please select a medicine.",
        variant: "destructive",
      });
      return;
    }

    createPrescriptionMutation.mutate({
      ...data,
      patientId: selectedPatientId,
      medicineId: selectedMedicineId,
    });
  };

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);
  const selectedMedicine = medicines?.find(m => m.id === selectedMedicineId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Prescription</DialogTitle>
          <DialogDescription>
            Add a new prescription with dosage and administration instructions.
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

            {/* Medicine Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Medicine</label>
              <Popover open={medicineSearchOpen} onOpenChange={setMedicineSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={medicineSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedMedicine
                      ? selectedMedicine.name
                      : "Select medicine..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search medicine..." />
                    <CommandEmpty>No medicine found.</CommandEmpty>
                    <CommandGroup>
                      {medicines?.map((medicine) => (
                        <CommandItem
                          key={medicine.id}
                          onSelect={() => {
                            setSelectedMedicineId(medicine.id);
                            setMedicineSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedMedicineId === medicine.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {medicine.name} - {medicine.unit}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Prescription Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 500mg, 2 tablets" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Once daily">Once daily</SelectItem>
                        <SelectItem value="Twice daily">Twice daily</SelectItem>
                        <SelectItem value="Three times daily">Three times daily</SelectItem>
                        <SelectItem value="Four times daily">Four times daily</SelectItem>
                        <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                        <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                        <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                        <SelectItem value="As needed">As needed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 7 days, 2 weeks" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prescribedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prescribed By</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      rows={3}
                      placeholder="Take with food, avoid alcohol, etc..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                disabled={createPrescriptionMutation.isPending}
              >
                {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}