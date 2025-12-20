import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { getDisplayName, getInitials, hasPersonalInfo } from '@/utils/name-utils';
import {
  User,
  Edit3,
  Save,
  X,
  Building
} from 'lucide-react';

const profileSchema = z.object({
  title: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  // Profile component for user settings and information
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();

  // Fetch detailed profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/profile'],
    enabled: !!user
  });

  // Fetch organization data if user has an organizationId
  const { data: organizationData } = useQuery({
    queryKey: ['/api/organizations', user?.organizationId],
    queryFn: () => fetch(`/api/organizations/${user?.organizationId}`).then(res => res.json()),
    enabled: !!user?.organizationId
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      title: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  // Update form when profile data is loaded
  // API returns { success: true, data: {...} } so we need to access .data
  const profile = (profileData as any)?.data || profileData;
  
  useEffect(() => {
    if (profile) {
      form.reset({
        title: profile.title || 'none',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return apiRequest("/api/profile", "PUT", data);
    },
    onSuccess: () => {
      // Refresh user session and invalidate profile cache
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
    },
    onError: (error: any) => {
      // Extract clean error message
      let errorMessage = "Failed to update profile. Please try again.";
      
      if (error?.message) {
        // Remove status code prefix (e.g., "500: ")
        const cleanMessage = error.message.replace(/^\d+:\s*/, '');
        // Only use the error message if it doesn't contain unrelated toast descriptions
        if (cleanMessage && !cleanMessage.includes('Direct database management')) {
          errorMessage = cleanMessage;
        }
      }
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    // Reset form to original profile data
    if (profile) {
      form.reset({
        title: profile.title || 'none',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your personal information and settings</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-lg font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {getInitials({
                    firstName: profile?.firstName,
                    lastName: profile?.lastName,
                    username: user?.username
                  })}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
              {getDisplayName({
                title: profile?.title,
                firstName: profile?.firstName,
                lastName: profile?.lastName,
                username: user?.username
              })}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              <Badge variant="secondary" className="capitalize">
                {user?.role || 'User'}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span>Role: {user?.role || 'User'}</span>
              </div>
              {user?.organizationId && (
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Building className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span>Organization: {organizationData?.name || `ID: ${user.organizationId}`}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Details Form */}
        <Card className="lg:col-span-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <Select
                        disabled={!isEditing}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Title</SelectItem>
                          <SelectItem value="Mr.">Mr.</SelectItem>
                          <SelectItem value="Mrs.">Mrs.</SelectItem>
                          <SelectItem value="Ms.">Ms.</SelectItem>
                          <SelectItem value="Miss">Miss</SelectItem>
                          <SelectItem value="Dr.">Dr.</SelectItem>
                          <SelectItem value="Prof.">Prof.</SelectItem>
                          <SelectItem value="Rev.">Rev.</SelectItem>
                          <SelectItem value="Chief">Chief</SelectItem>
                          <SelectItem value="Alhaji">Alhaji</SelectItem>
                          <SelectItem value="Alhaja">Alhaja</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isEditing && (
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}