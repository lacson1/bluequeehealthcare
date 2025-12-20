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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, Frown, Target, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// PHQ-9 Questions
const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself - or that you are a failure",
  "Trouble concentrating on things",
  "Moving or speaking slowly, or being fidgety/restless",
  "Thoughts of self-harm or being better off dead",
];

// GAD-7 Questions
const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen",
];

const RESPONSE_OPTIONS = [
  { value: "0", label: "Not at all", score: 0 },
  { value: "1", label: "Several days", score: 1 },
  { value: "2", label: "More than half the days", score: 2 },
  { value: "3", label: "Nearly every day", score: 3 },
];

const mentalHealthFormSchema = z.object({
  // PHQ-9
  phq9Responses: z.array(z.string()).length(9).optional(),
  
  // GAD-7
  gad7Responses: z.array(z.string()).length(7).optional(),
  
  // Wellbeing
  wellbeingScore: z.number().min(0).max(25).optional(),
  lifeSatisfactionScore: z.number().min(1).max(10).optional(),
  purposeScore: z.number().min(1).max(10).optional(),
  resilienceScore: z.number().min(1).max(10).optional(),
  
  // Cognitive
  cognitiveScreenType: z.string().optional(),
  cognitiveScore: z.number().optional(),
  cognitiveMaxScore: z.number().optional(),
  
  notes: z.string().optional(),
});

type MentalHealthFormData = z.infer<typeof mentalHealthFormSchema>;

interface MentalHealthScreeningFormProps {
  patientId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getSeverityBadge(score: number, type: 'phq9' | 'gad7') {
  if (type === 'phq9') {
    if (score <= 4) return { label: "Minimal", color: "bg-green-100 text-green-700" };
    if (score <= 9) return { label: "Mild", color: "bg-yellow-100 text-yellow-700" };
    if (score <= 14) return { label: "Moderate", color: "bg-orange-100 text-orange-700" };
    if (score <= 19) return { label: "Moderately Severe", color: "bg-red-100 text-red-700" };
    return { label: "Severe", color: "bg-red-200 text-red-800" };
  } else {
    if (score <= 4) return { label: "Minimal", color: "bg-green-100 text-green-700" };
    if (score <= 9) return { label: "Mild", color: "bg-yellow-100 text-yellow-700" };
    if (score <= 14) return { label: "Moderate", color: "bg-orange-100 text-orange-700" };
    return { label: "Severe", color: "bg-red-100 text-red-700" };
  }
}

export function MentalHealthScreeningForm({
  patientId,
  open,
  onOpenChange,
}: MentalHealthScreeningFormProps) {
  const [activeSection, setActiveSection] = useState("phq9");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MentalHealthFormData>({
    resolver: zodResolver(mentalHealthFormSchema),
    defaultValues: {
      phq9Responses: Array(9).fill("0"),
      gad7Responses: Array(7).fill("0"),
      lifeSatisfactionScore: 5,
      purposeScore: 5,
      resilienceScore: 5,
    },
  });

  // Calculate PHQ-9 score
  const phq9Responses = form.watch("phq9Responses") || [];
  const phq9Score = phq9Responses.reduce((sum, val) => sum + (parseInt(val) || 0), 0);
  const phq9Severity = getSeverityBadge(phq9Score, 'phq9');

  // Calculate GAD-7 score
  const gad7Responses = form.watch("gad7Responses") || [];
  const gad7Score = gad7Responses.reduce((sum, val) => sum + (parseInt(val) || 0), 0);
  const gad7Severity = getSeverityBadge(gad7Score, 'gad7');

  const mutation = useMutation({
    mutationFn: async (data: MentalHealthFormData) => {
      const submitData = {
        ...data,
        phq9Score,
        phq9Severity: phq9Severity.label.toLowerCase().replace(' ', '_'),
        phq9Responses: JSON.stringify(data.phq9Responses),
        gad7Score,
        gad7Severity: gad7Severity.label.toLowerCase(),
        gad7Responses: JSON.stringify(data.gad7Responses),
      };
      
      const response = await apiRequest(
        `/api/patients/${patientId}/mental-health-screenings`,
        "POST",
        submitData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/longevity-data`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/mental-health-screenings`] });
      toast({
        title: "Screening Saved",
        description: "Mental health screening has been recorded successfully.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save mental health screening.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MentalHealthFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Mental Health Screening
          </DialogTitle>
          <DialogDescription>
            Standardized assessments for depression, anxiety, and wellbeing
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeSection} onValueChange={setActiveSection}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="phq9" className="text-xs">
                  <Frown className="h-3 w-3 mr-1" />
                  PHQ-9 (Depression)
                </TabsTrigger>
                <TabsTrigger value="gad7" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  GAD-7 (Anxiety)
                </TabsTrigger>
                <TabsTrigger value="wellbeing" className="text-xs">
                  <Heart className="h-3 w-3 mr-1" />
                  Wellbeing
                </TabsTrigger>
                <TabsTrigger value="cognitive" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  Cognitive
                </TabsTrigger>
              </TabsList>

              {/* PHQ-9 Section */}
              <TabsContent value="phq9" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium">
                          PHQ-9 Depression Screening
                        </CardTitle>
                        <CardDescription>
                          Over the last 2 weeks, how often have you been bothered by:
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{phq9Score}/27</div>
                        <Badge className={phq9Severity.color}>{phq9Severity.label}</Badge>
                      </div>
                    </div>
                    <Progress value={(phq9Score / 27) * 100} className="h-2 mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {PHQ9_QUESTIONS.map((question, index) => (
                      <FormField
                        key={index}
                        control={form.control}
                        name={`phq9Responses.${index}`}
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-normal">
                              {index + 1}. {question}
                              {index === 8 && (
                                <span className="text-red-500 ml-1">*Critical</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-wrap gap-2"
                              >
                                {RESPONSE_OPTIONS.map((option) => (
                                  <div key={option.value} className="flex items-center space-x-1">
                                    <RadioGroupItem value={option.value} id={`phq9-${index}-${option.value}`} />
                                    <label 
                                      htmlFor={`phq9-${index}-${option.value}`}
                                      className="text-xs cursor-pointer"
                                    >
                                      {option.label}
                                    </label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* GAD-7 Section */}
              <TabsContent value="gad7" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium">
                          GAD-7 Anxiety Screening
                        </CardTitle>
                        <CardDescription>
                          Over the last 2 weeks, how often have you been bothered by:
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{gad7Score}/21</div>
                        <Badge className={gad7Severity.color}>{gad7Severity.label}</Badge>
                      </div>
                    </div>
                    <Progress value={(gad7Score / 21) * 100} className="h-2 mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {GAD7_QUESTIONS.map((question, index) => (
                      <FormField
                        key={index}
                        control={form.control}
                        name={`gad7Responses.${index}`}
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-normal">
                              {index + 1}. {question}
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-wrap gap-2"
                              >
                                {RESPONSE_OPTIONS.map((option) => (
                                  <div key={option.value} className="flex items-center space-x-1">
                                    <RadioGroupItem value={option.value} id={`gad7-${index}-${option.value}`} />
                                    <label 
                                      htmlFor={`gad7-${index}-${option.value}`}
                                      className="text-xs cursor-pointer"
                                    >
                                      {option.label}
                                    </label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Wellbeing Section */}
              <TabsContent value="wellbeing" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-pink-700">
                      Life Satisfaction & Purpose
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="lifeSatisfactionScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Life Satisfaction (1-10)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="range"
                                min="1"
                                max="10"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Very Dissatisfied</span>
                                <span className="font-bold text-lg">{field.value}</span>
                                <span>Very Satisfied</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Overall, how satisfied are you with your life?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="purposeScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sense of Purpose (1-10)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="range"
                                min="1"
                                max="10"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>No Purpose</span>
                                <span className="font-bold text-lg">{field.value}</span>
                                <span>Strong Purpose</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Do you feel your life has meaning and purpose?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="resilienceScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resilience (1-10)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="range"
                                min="1"
                                max="10"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Low Resilience</span>
                                <span className="font-bold text-lg">{field.value}</span>
                                <span>High Resilience</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            How well do you bounce back from difficulties?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="wellbeingScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WHO-5 Wellbeing Score (0-25)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="25"
                              placeholder="Enter WHO-5 score if available"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            If WHO-5 screening was performed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cognitive Section */}
              <TabsContent value="cognitive" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-700">
                      Cognitive Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cognitiveScreenType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Screening Type</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., MMSE, MoCA, Mini-Cog" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cognitiveScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Score Achieved</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Score"
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
                      name="cognitiveMaxScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Score</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Max possible score"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>e.g., 30 for MMSE/MoCA</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Clinical Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional observations or notes..."
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

            {/* Score Summary */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardContent className="py-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Depression (PHQ-9)</div>
                    <div className="text-2xl font-bold">{phq9Score}/27</div>
                    <Badge className={phq9Severity.color}>{phq9Severity.label}</Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Anxiety (GAD-7)</div>
                    <div className="text-2xl font-bold">{gad7Score}/21</div>
                    <Badge className={gad7Severity.color}>{gad7Severity.label}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Screening"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

