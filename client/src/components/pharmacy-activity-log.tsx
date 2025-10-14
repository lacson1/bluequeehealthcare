import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  FileText, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Package,
  Pill,
  User,
  Calendar,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

// Schema for pharmacy activity logging
const pharmacyActivitySchema = z.object({
  activityType: z.enum(['dispensing', 'restocking', 'review', 'consultation', 'inventory_check']),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  patientId: z.number().optional(),
  medicineId: z.number().optional(),
  prescriptionId: z.number().optional(),
  quantity: z.number().optional(),
  comments: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

type PharmacyActivityForm = z.infer<typeof pharmacyActivitySchema>;

interface PharmacyActivityLogProps {
  onActivityLogged?: () => void;
}

export function PharmacyActivityLog({ onActivityLogged }: PharmacyActivityLogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  // Fetch pharmacy activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['/api/pharmacy/activities'],
  });

  // Form for adding new activity
  const form = useForm<PharmacyActivityForm>({
    resolver: zodResolver(pharmacyActivitySchema),
    defaultValues: {
      activityType: 'dispensing',
      title: '',
      description: '',
      priority: 'normal',
    },
  });

  // Mutation for creating activity
  const createActivity = useMutation({
    mutationFn: (data: PharmacyActivityForm) => apiRequest('/api/pharmacy/activities', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity logged successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/activities'] });
      setShowAddDialog(false);
      form.reset();
      onActivityLogged?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log activity",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: PharmacyActivityForm) => {
    createActivity.mutate(data);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'dispensing': return <Pill className="w-4 h-4" />;
      case 'restocking': return <Package className="w-4 h-4" />;
      case 'review': return <FileText className="w-4 h-4" />;
      case 'consultation': return <User className="w-4 h-4" />;
      case 'inventory_check': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'dispensing': return 'bg-blue-100 text-blue-800';
      case 'restocking': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'consultation': return 'bg-orange-100 text-orange-800';
      case 'inventory_check': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredActivities = activities.filter(activity => 
    filterType === "all" || activity.activityType === filterType
  );

  return (
    <Card className="w-full">
      <CardHeader className="bg-blue-50 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <FileText className="w-5 h-5" />
            Pharmacy Activity Log
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Pharmacy Activity</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="activityType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select activity type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dispensing">Dispensing</SelectItem>
                            <SelectItem value="restocking">Restocking</SelectItem>
                            <SelectItem value="review">Medication Review</SelectItem>
                            <SelectItem value="consultation">Patient Consultation</SelectItem>
                            <SelectItem value="inventory_check">Inventory Check</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of activity" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed description of the activity"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity (if applicable)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="e.g., 30 tablets dispensed"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Comments</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional notes or observations"
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createActivity.isPending}
                      className="flex-1"
                    >
                      {createActivity.isPending ? "Logging..." : "Log Activity"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Filter Controls */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Filter by type:</span>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="dispensing">Dispensing</SelectItem>
              <SelectItem value="restocking">Restocking</SelectItem>
              <SelectItem value="review">Reviews</SelectItem>
              <SelectItem value="consultation">Consultations</SelectItem>
              <SelectItem value="inventory_check">Inventory Checks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading activities...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activities found. Start logging your pharmacy activities to keep track of your daily work.
            </div>
          ) : (
            filteredActivities.map((activity: any) => (
              <div key={activity.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getActivityTypeColor(activity.activityType)}`}>
                      {getActivityIcon(activity.activityType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                        <Badge variant={getPriorityColor(activity.priority)} className="text-xs">
                          {activity.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{activity.description}</p>
                      {activity.quantity && (
                        <p className="text-xs text-blue-600">Quantity: {activity.quantity}</p>
                      )}
                      {activity.comments && (
                        <p className="text-xs text-gray-500 mt-1 italic">{activity.comments}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(activity.createdAt), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(activity.createdAt), 'hh:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}