import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Moon, Cigarette, Wine, Apple, Pill } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const lifestyleFormSchema = z.object({
  // Exercise
  exerciseFrequency: z.string().optional(),
  exerciseType: z.string().optional(),
  exerciseDurationMinutes: z.number().min(0).max(300).optional(),
  dailySteps: z.number().min(0).max(50000).optional(),
  vo2MaxEstimate: z.number().min(10).max(80).optional(),
  
  // Sleep
  sleepDurationHours: z.number().min(0).max(24).optional(),
  sleepQuality: z.string().optional(),
  sleepLatencyMinutes: z.number().min(0).max(180).optional(),
  sleepDisturbances: z.number().min(0).max(20).optional(),
  usingSleepAids: z.boolean().optional(),
  
  // Smoking
  smokingStatus: z.string().optional(),
  cigarettesPerDay: z.number().min(0).max(100).optional(),
  yearsSmoked: z.number().min(0).max(80).optional(),
  yearsSinceQuit: z.number().min(0).max(80).optional(),
  
  // Alcohol
  alcoholStatus: z.string().optional(),
  drinksPerWeek: z.number().min(0).max(100).optional(),
  bingeEpisodesPerMonth: z.number().min(0).max(30).optional(),
  
  // Diet
  dietType: z.string().optional(),
  vegetableServingsPerDay: z.number().min(0).max(20).optional(),
  fruitServingsPerDay: z.number().min(0).max(20).optional(),
  processedFoodFrequency: z.string().optional(),
  sugarIntake: z.string().optional(),
  waterIntakeLiters: z.number().min(0).max(10).optional(),
  caffeineIntakeMg: z.number().min(0).max(1000).optional(),
  
  // Fasting
  intermittentFasting: z.boolean().optional(),
  fastingWindowHours: z.number().min(0).max(24).optional(),
  mealsPerDay: z.number().min(1).max(10).optional(),
  
  // Supplements
  takingSupplements: z.boolean().optional(),
  supplementsList: z.string().optional(),
  
  notes: z.string().optional(),
});

type LifestyleFormData = z.infer<typeof lifestyleFormSchema>;

interface LifestyleAssessmentFormProps {
  patientId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingData?: LifestyleFormData | null;
}

export function LifestyleAssessmentForm({
  patientId,
  open,
  onOpenChange,
  existingData,
}: LifestyleAssessmentFormProps) {
  const [activeSection, setActiveSection] = useState("exercise");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LifestyleFormData>({
    resolver: zodResolver(lifestyleFormSchema),
    defaultValues: existingData || {
      exerciseFrequency: "",
      exerciseType: "",
      sleepDurationHours: 7,
      sleepQuality: "",
      smokingStatus: "never",
      alcoholStatus: "none",
      dietType: "",
      vegetableServingsPerDay: 3,
      fruitServingsPerDay: 2,
      intermittentFasting: false,
      takingSupplements: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LifestyleFormData) => {
      const response = await apiRequest(
        `/api/patients/${patientId}/lifestyle-assessments`,
        "POST",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/longevity-data`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/lifestyle-assessments`] });
      toast({
        title: "Assessment Saved",
        description: "Lifestyle assessment has been recorded successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save lifestyle assessment.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LifestyleFormData) => {
    // Calculate pack-years if smoking data available
    if (data.smokingStatus === "current" || data.smokingStatus === "former") {
      const packYears = ((data.cigarettesPerDay || 0) * (data.yearsSmoked || 0)) / 20;
      (data as any).packYears = packYears;
    }
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-emerald-600" />
            Lifestyle Assessment
          </DialogTitle>
          <DialogDescription>
            Comprehensive lifestyle evaluation for longevity assessment
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeSection} onValueChange={setActiveSection}>
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="exercise" className="text-xs">
                  <Dumbbell className="h-3 w-3 mr-1" />
                  Exercise
                </TabsTrigger>
                <TabsTrigger value="sleep" className="text-xs">
                  <Moon className="h-3 w-3 mr-1" />
                  Sleep
                </TabsTrigger>
                <TabsTrigger value="smoking" className="text-xs">
                  <Cigarette className="h-3 w-3 mr-1" />
                  Smoking
                </TabsTrigger>
                <TabsTrigger value="alcohol" className="text-xs">
                  <Wine className="h-3 w-3 mr-1" />
                  Alcohol
                </TabsTrigger>
                <TabsTrigger value="diet" className="text-xs">
                  <Apple className="h-3 w-3 mr-1" />
                  Diet
                </TabsTrigger>
                <TabsTrigger value="supplements" className="text-xs">
                  <Pill className="h-3 w-3 mr-1" />
                  Supplements
                </TabsTrigger>
              </TabsList>

              {/* Exercise Section */}
              <TabsContent value="exercise" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-emerald-700">
                      Physical Activity & Exercise
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="exerciseFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exercise Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="How often do you exercise?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None / Sedentary</SelectItem>
                              <SelectItem value="1-2x/week">1-2 times per week</SelectItem>
                              <SelectItem value="3-4x/week">3-4 times per week</SelectItem>
                              <SelectItem value="5+/week">5+ times per week</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="exerciseType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Exercise Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Type of exercise" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cardio">Cardio (running, cycling, swimming)</SelectItem>
                              <SelectItem value="strength">Strength Training</SelectItem>
                              <SelectItem value="mixed">Mixed (Cardio + Strength)</SelectItem>
                              <SelectItem value="flexibility">Flexibility (yoga, stretching)</SelectItem>
                              <SelectItem value="hiit">HIIT / High Intensity</SelectItem>
                              <SelectItem value="walking">Walking Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="exerciseDurationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="30"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>Average minutes per session</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dailySteps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Steps</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="8000"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>Average daily step count</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vo2MaxEstimate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VO2 Max (ml/kg/min)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="35"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>If known from fitness test</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sleep Section */}
              <TabsContent value="sleep" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-indigo-700">
                      Sleep Quality & Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sleepDurationHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Average Sleep Duration (hours)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="7"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>Optimal: 7-8 hours</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sleepQuality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sleep Quality</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Rate your sleep quality" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="excellent">Excellent</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                              <SelectItem value="poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sleepLatencyMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time to Fall Asleep (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="15"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>Normal: 10-20 minutes</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sleepDisturbances"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Night Wakings</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>Times waking per night</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="usingSleepAids"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Using Sleep Aids</FormLabel>
                            <FormDescription>Medications or supplements for sleep</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Smoking Section */}
              <TabsContent value="smoking" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-red-700">
                      Smoking Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="smokingStatus"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Current Smoking Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select smoking status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="never">Never Smoked</SelectItem>
                              <SelectItem value="former">Former Smoker (quit)</SelectItem>
                              <SelectItem value="current">Current Smoker</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {(form.watch("smokingStatus") === "current" || form.watch("smokingStatus") === "former") && (
                      <>
                        <FormField
                          control={form.control}
                          name="cigarettesPerDay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cigarettes per Day</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="10"
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
                          name="yearsSmoked"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years Smoked</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="10"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {form.watch("smokingStatus") === "former" && (
                      <FormField
                        control={form.control}
                        name="yearsSinceQuit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years Since Quit</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="5"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Alcohol Section */}
              <TabsContent value="alcohol" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-amber-700">
                      Alcohol Consumption
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="alcoholStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alcohol Consumption Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select consumption level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None / Never</SelectItem>
                              <SelectItem value="occasional">Occasional (special occasions)</SelectItem>
                              <SelectItem value="moderate">Moderate (1-2 drinks/day)</SelectItem>
                              <SelectItem value="heavy">Heavy (3+ drinks/day)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="drinksPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Drinks per Week</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>1 drink = 12oz beer, 5oz wine, 1.5oz spirits</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bingeEpisodesPerMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Binge Episodes per Month</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>5+ drinks in one sitting</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Diet Section */}
              <TabsContent value="diet" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-700">
                      Diet & Nutrition
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dietType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Diet Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select diet type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="omnivore">Standard Omnivore</SelectItem>
                              <SelectItem value="mediterranean">Mediterranean</SelectItem>
                              <SelectItem value="vegetarian">Vegetarian</SelectItem>
                              <SelectItem value="vegan">Vegan</SelectItem>
                              <SelectItem value="keto">Keto / Low-Carb</SelectItem>
                              <SelectItem value="paleo">Paleo</SelectItem>
                              <SelectItem value="dash">DASH Diet</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="processedFoodFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Processed Food Consumption</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="How often?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="rarely">Rarely (once a week or less)</SelectItem>
                              <SelectItem value="sometimes">Sometimes (few times/week)</SelectItem>
                              <SelectItem value="often">Often (daily)</SelectItem>
                              <SelectItem value="very_often">Very Often (multiple times/day)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vegetableServingsPerDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vegetable Servings/Day</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>Optimal: 5+ servings</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fruitServingsPerDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fruit Servings/Day</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="2"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>Optimal: 2-3 servings</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="waterIntakeLiters"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Water Intake (liters/day)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="2"
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
                      name="caffeineIntakeMg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Caffeine Intake (mg/day)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="200"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>1 coffee ≈ 95mg</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="intermittentFasting"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Intermittent Fasting</FormLabel>
                            <FormDescription>Time-restricted eating</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("intermittentFasting") && (
                      <FormField
                        control={form.control}
                        name="fastingWindowHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fasting Window (hours)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="16"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormDescription>Common: 16:8 (16 hours fasting)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Supplements Section */}
              <TabsContent value="supplements" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-purple-700">
                      Supplements & Additional Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="takingSupplements"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Taking Supplements</FormLabel>
                            <FormDescription>Vitamins, minerals, or other supplements</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("takingSupplements") && (
                      <FormField
                        control={form.control}
                        name="supplementsList"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplements List</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g., Vitamin D 2000IU, Omega-3, Magnesium..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional lifestyle factors or considerations..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Assessment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

