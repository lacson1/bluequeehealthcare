import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Loader2 } from "lucide-react";

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  type: z.enum(["clinic", "hospital", "health_center", "pharmacy", "laboratory"]),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  themeColor: z.string().min(1, "Theme color is required")
});

type OrganizationData = z.infer<typeof organizationSchema>;

const ORGANIZATION_TYPES = [
  { value: "clinic", label: "Clinic", description: "Small to medium healthcare facility" },
  { value: "hospital", label: "Hospital", description: "Large healthcare institution" },
  { value: "health_center", label: "Health Center", description: "Community healthcare facility" },
  { value: "pharmacy", label: "Pharmacy", description: "Medication dispensing facility" },
  { value: "laboratory", label: "Laboratory", description: "Medical testing facility" }
];

const THEME_COLORS = [
  { value: "#3B82F6", label: "Blue", color: "#3B82F6" },
  { value: "#10B981", label: "Green", color: "#10B981" },
  { value: "#F59E0B", label: "Orange", color: "#F59E0B" },
  { value: "#EF4444", label: "Red", color: "#EF4444" },
  { value: "#8B5CF6", label: "Purple", color: "#8B5CF6" },
  { value: "#EC4899", label: "Pink", color: "#EC4899" },
  { value: "#6B7280", label: "Gray", color: "#6B7280" }
];

interface OrganizationRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationRegistrationModal({ open, onOpenChange }: OrganizationRegistrationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<OrganizationData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      type: undefined,
      email: "",
      phone: "",
      address: "",
      website: "",
      themeColor: "#3B82F6"
    }
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: OrganizationData) => {
      return apiRequest("POST", "/api/organizations", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organization created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create organization",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: OrganizationData) => {
    createOrganizationMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Register New Organization
          </DialogTitle>
          <DialogDescription>
            Add a new healthcare organization to your multi-tenant system
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., General Hospital Lagos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORGANIZATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@organization.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+234 xxx xxx xxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Full address of the organization"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://organization.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="themeColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme Color *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select theme color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {THEME_COLORS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: color.color }}
                              />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={createOrganizationMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createOrganizationMutation.isPending}
                className="min-w-[120px]"
              >
                {createOrganizationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}