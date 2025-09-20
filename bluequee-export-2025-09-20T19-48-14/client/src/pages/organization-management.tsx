import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Plus,
  Edit3,
  Users,
  Settings,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  type: z.string().default("clinic"),
  logoUrl: z.string().optional(),
  themeColor: z.string().default("#3B82F6"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email address").min(1, "Email address is required"),
  website: z.string().optional()
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface Organization {
  id: number;
  name: string;
  type: string;
  logoUrl?: string;
  themeColor: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    users: number;
    patients: number;
  };
}

export default function OrganizationManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [nameCheckTimeout, setNameCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [checkingName, setCheckingName] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const { data: organizations = [], isLoading, refetch } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  // Filtered and sorted organizations
  const filteredAndSortedOrganizations = useMemo(() => {
    let filtered = organizations.filter(org => {
      const matchesSearch = searchTerm === "" || 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === "all" || org.type === filterType;
      
      return matchesSearch && matchesType;
    });

    // Sort organizations
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "type":
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "status":
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [organizations, searchTerm, filterType, sortBy, sortOrder]);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      type: "clinic",
      themeColor: "#3B82F6",
      address: "",
      phone: "",
      email: "",
      website: ""
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: OrganizationFormData) => 
      apiRequest("/api/superadmin/organizations", "POST", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Organization created successfully!" });
      setIsCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    },
    onError: (error: any) => {
      console.error("Organization creation error:", error);
      
      // Handle specific error cases
      let errorMessage = "Failed to create organization";
      if (error?.message?.includes("organization with this name already exists")) {
        errorMessage = "An organization with this name already exists. Please choose a different name.";
      } else if (error?.message?.includes("email already exists")) {
        errorMessage = "This email address is already in use by another organization.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: "Cannot Create Organization", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: OrganizationFormData }) =>
      apiRequest(`/api/superadmin/organizations/${id}`, "PATCH", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Organization updated successfully!" });
      setEditingOrg(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update organization", variant: "destructive" });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest(`/api/superadmin/organizations/${id}/status`, "PATCH", { isActive }),
    onSuccess: () => {
      toast({ title: "Success", description: "Organization status updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  });

  const onSubmit = (data: OrganizationFormData) => {
    try {
      if (editingOrg) {
        updateMutation.mutate({ id: editingOrg.id, data });
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({ title: "Error", description: "Failed to submit form", variant: "destructive" });
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    form.reset({
      name: org.name,
      type: org.type,
      logoUrl: org.logoUrl || "",
      themeColor: org.themeColor,
      address: org.address || "",
      phone: org.phone || "",
      email: org.email || "",
      website: org.website || ""
    });
    setIsCreateModalOpen(true);
  };

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, isActive: !currentStatus });
  };

  // Real-time name availability checking
  const checkNameAvailability = (name: string) => {
    if (!name || name.length < 2) {
      setNameAvailable(null);
      return;
    }

    // Skip check if editing and name hasn't changed
    if (editingOrg && editingOrg.name.toLowerCase() === name.toLowerCase()) {
      setNameAvailable(true);
      return;
    }

    const existingOrg = organizations.find(
      org => org.name.toLowerCase() === name.toLowerCase() && org.id !== editingOrg?.id
    );
    
    setNameAvailable(!existingOrg);
  };

  // Handle name input changes with debouncing
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    
    setCheckingName(true);
    if (nameCheckTimeout) {
      clearTimeout(nameCheckTimeout);
    }
    
    const timeout = setTimeout(() => {
      checkNameAvailability(name);
      setCheckingName(false);
    }, 500);
    
    setNameCheckTimeout(timeout);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hospital': return '🏥';
      case 'health_center': return '🏢';
      default: return '🏥';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-red-100 text-red-800';
      case 'health_center': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Organization Management</h1>
          <p className="text-slate-600 mt-2">Manage multiple clinics and healthcare facilities</p>
        </div>
        <Dialog open={isCreateModalOpen || !!editingOrg} onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setEditingOrg(null);
            form.reset();
            // Reset validation state
            setNameAvailable(null);
            setCheckingName(false);
            if (nameCheckTimeout) {
              clearTimeout(nameCheckTimeout);
              setNameCheckTimeout(null);
            }
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { 
              setEditingOrg(null); 
              form.reset(); 
              setIsCreateModalOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingOrg ? "Edit Organization" : "Create New Organization"}
              </DialogTitle>
              <DialogDescription>
                {editingOrg ? "Update organization details" : "Add a new clinic or healthcare facility to the system"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      {...form.register("name")}
                      onChange={handleNameChange}
                      placeholder="e.g., St. Mary's Clinic"
                      className={`${
                        nameAvailable === false ? 'border-red-500 focus:border-red-500' : 
                        nameAvailable === true ? 'border-green-500 focus:border-green-500' : ''
                      }`}
                    />
                    {checkingName && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    {!checkingName && nameAvailable === true && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                    )}
                    {!checkingName && nameAvailable === false && (
                      <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                    )}
                  </div>
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                  )}
                  {!checkingName && nameAvailable === false && (
                    <p className="text-sm text-red-600">This organization name is already taken. Please choose a different name.</p>
                  )}
                  {!checkingName && nameAvailable === true && form.watch("name") && (
                    <p className="text-sm text-green-600">This organization name is available!</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Organization Type</Label>
                  <Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="health_center">Health Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    placeholder="+234 xxx xxx xxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="info@clinic.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    {...form.register("website")}
                    placeholder="https://www.clinic.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="themeColor">Theme Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="themeColor"
                      type="color"
                      {...form.register("themeColor")}
                      className="w-20 h-10"
                    />
                    <Input
                      {...form.register("themeColor")}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  {...form.register("address")}
                  placeholder="Street address, city, state"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                <Input
                  id="logoUrl"
                  {...form.register("logoUrl")}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingOrg(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    createMutation.isPending || 
                    updateMutation.isPending || 
                    (!editingOrg && nameAvailable === false) ||
                    checkingName
                  }
                >
                  {editingOrg ? "Update" : "Create"} Organization
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter by Type */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="clinic">Clinics</SelectItem>
                <SelectItem value="hospital">Hospitals</SelectItem>
                <SelectItem value="health_center">Health Centers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 whitespace-nowrap">
          {filteredAndSortedOrganizations.length} of {organizations.length} organizations
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedOrganizations.map((org) => (
          <Card key={org.id} className="relative overflow-hidden">
            <div 
              className="h-2 w-full" 
              style={{ backgroundColor: org.themeColor }}
            ></div>
            
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getTypeIcon(org.type)}</div>
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <Badge className={getTypeBadgeColor(org.type)}>
                      {org.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {org.isActive ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                {org.address && (
                  <div className="flex items-center text-slate-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="truncate">{org.address}</span>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center text-slate-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{org.phone}</span>
                  </div>
                )}
                {org.email && (
                  <div className="flex items-center text-slate-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{org.email}</span>
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center text-slate-600">
                    <Globe className="h-4 w-4 mr-2" />
                    <span className="truncate">{org.website}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center text-sm text-slate-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(org.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(org)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={org.isActive ? "destructive" : "default"}
                    onClick={() => handleToggleStatus(org.id, org.isActive)}
                  >
                    {org.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>

              {org._count && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <Users className="h-4 w-4 mr-1 text-blue-600" />
                      <span className="font-semibold text-blue-600">{org._count.users}</span>
                    </div>
                    <p className="text-xs text-slate-500">Staff</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <Building2 className="h-4 w-4 mr-1 text-green-600" />
                      <span className="font-semibold text-green-600">{org._count.patients}</span>
                    </div>
                    <p className="text-xs text-slate-500">Patients</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* No Results State */}
        {filteredAndSortedOrganizations.length === 0 && organizations.length > 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-500 max-w-md">
              No organizations match your current search and filter criteria. Try adjusting your search terms or filters.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
              }}
              className="mt-4"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {organizations.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-16 w-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              No Organizations Yet
            </h3>
            <p className="text-slate-500 mb-4">
              Create your first clinic or healthcare facility to get started with the multi-tenant system.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Organization
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}