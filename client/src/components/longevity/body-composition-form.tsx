import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Ruler, Activity, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const bodyCompositionFormSchema = z.object({
  // Core measurements
  weight: z.number().min(20).max(300).optional(),
  height: z.number().min(100).max(250).optional(),
  
  // Body composition
  bodyFatPercentage: z.number().min(3).max(60).optional(),
  visceralFatLevel: z.number().min(1).max(59).optional(),
  muscleMassKg: z.number().min(10).max(100).optional(),
  boneMassKg: z.number().min(1).max(10).optional(),
  waterPercentage: z.number().min(30).max(80).optional(),
  metabolicAge: z.number().min(10).max(120).optional(),
  basalMetabolicRate: z.number().min(800).max(4000).optional(),
  
  // Circumferences
  waistCircumferenceCm: z.number().min(40).max(200).optional(),
  hipCircumferenceCm: z.number().min(50).max(200).optional(),
  neckCircumferenceCm: z.number().min(20).max(70).optional(),
  
  // Fitness metrics
  gripStrengthKg: z.number().min(5).max(100).optional(),
  sitToStandSeconds: z.number().min(3).max(60).optional(),
  balanceTestSeconds: z.number().min(0).max(120).optional(),
  flexibilityReachCm: z.number().min(-30).max(50).optional(),
  
  measurementMethod: z.string().optional(),
  notes: z.string().optional(),
});

type BodyCompositionFormData = z.infer<typeof bodyCompositionFormSchema>;

interface BodyCompositionFormProps {
  patientId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingData?: Partial<BodyCompositionFormData> | null;
}

export function BodyCompositionForm({
  patientId,
  open,
  onOpenChange,
  existingData,
}: BodyCompositionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BodyCompositionFormData>({
    resolver: zodResolver(bodyCompositionFormSchema),
    defaultValues: existingData || {},
  });

  // Calculate BMI when weight and height change
  const weight = form.watch("weight");
  const height = form.watch("height");
  const bmi = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(1) : null;

  // Calculate waist-to-hip ratio
  const waist = form.watch("waistCircumferenceCm");
  const hip = form.watch("hipCircumferenceCm");
  const waistToHipRatio = waist && hip ? (waist / hip).toFixed(2) : null;

  // Get BMI category
  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-blue-600" };
    if (bmi < 25) return { label: "Normal", color: "text-green-600" };
    if (bmi < 30) return { label: "Overweight", color: "text-yellow-600" };
    return { label: "Obese", color: "text-red-600" };
  };

  const mutation = useMutation({
    mutationFn: async (data: BodyCompositionFormData) => {
      // Calculate BMI and waist-to-hip ratio
      const submitData = {
        ...data,
        bmi: data.weight && data.height ? data.weight / Math.pow(data.height / 100, 2) : undefined,
        waistToHipRatio: data.waistCircumferenceCm && data.hipCircumferenceCm 
          ? data.waistCircumferenceCm / data.hipCircumferenceCm 
          : undefined,
      };
      
      const response = await apiRequest(
        `/api/patients/${patientId}/body-composition`,
        "POST",
        submitData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/longevity-data`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/body-composition`] });
      toast({
        title: "Measurements Saved",
        description: "Body composition has been recorded successfully.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save body composition.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BodyCompositionFormData) => {
    mutation.mutate(data);
  };

  const bmiValue = bmi ? parseFloat(bmi) : null;
  const bmiCategory = bmiValue ? getBmiCategory(bmiValue) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" />
            Body Composition Assessment
          </DialogTitle>
          <DialogDescription>
            Detailed body measurements for health and fitness tracking
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Calculated Metrics Display */}
            {(bmi || waistToHipRatio) && (
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardContent className="py-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    {bmi && (
                      <div>
                        <div className="text-sm text-muted-foreground">BMI</div>
                        <div className="text-2xl font-bold">{bmi}</div>
                        {bmiCategory && (
                          <span className={`text-sm font-medium ${bmiCategory.color}`}>
                            {bmiCategory.label}
                          </span>
                        )}
                      </div>
                    )}
                    {waistToHipRatio && (
                      <div>
                        <div className="text-sm text-muted-foreground">Waist-to-Hip Ratio</div>
                        <div className="text-2xl font-bold">{waistToHipRatio}</div>
                        <span className={`text-sm font-medium ${parseFloat(waistToHipRatio) < 0.85 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {parseFloat(waistToHipRatio) < 0.85 ? 'Healthy' : 'Elevated'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Core Measurements */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Core Measurements
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="70"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="170"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bodyFatPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Fat %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="20"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Healthy: 10-20% (M), 18-28% (F)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visceralFatLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visceral Fat Level (1-59)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="8"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Optimal: 1-9</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="muscleMassKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Muscle Mass (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="55"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="waterPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Water %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="55"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Optimal: 50-65%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metabolicAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metabolic Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="35"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Lower than chronological = healthier</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="basalMetabolicRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BMR (calories/day)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1600"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Circumferences */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Circumference Measurements
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="waistCircumferenceCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waist (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="80"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>At navel level</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hipCircumferenceCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hip (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="95"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Widest point</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="neckCircumferenceCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Neck (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="38"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Fitness Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Functional Fitness Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gripStrengthKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grip Strength (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="35"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Dominant hand, predictor of mortality</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sitToStandSeconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>5x Sit-to-Stand (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Lower = better (goal: &lt;12s)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="balanceTestSeconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Single Leg Stand (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Eyes closed, goal: 30+ seconds</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="flexibilityReachCm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sit-and-Reach (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="5"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>+ = past toes, - = before toes</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Method & Notes */}
            <Card>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="measurementMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Measurement Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="How were measurements taken?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dexa">DEXA Scan (gold standard)</SelectItem>
                          <SelectItem value="bia">Bioelectrical Impedance (BIA)</SelectItem>
                          <SelectItem value="bodpod">BodPod / Air Displacement</SelectItem>
                          <SelectItem value="skinfold">Skinfold Calipers</SelectItem>
                          <SelectItem value="hydrostatic">Hydrostatic Weighing</SelectItem>
                          <SelectItem value="scale">Smart Scale</SelectItem>
                          <SelectItem value="manual">Manual Measurements</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Textarea placeholder="Any additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Measurements"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

