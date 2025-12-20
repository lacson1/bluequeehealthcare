import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/components/role-guard';
import { apiRequest } from '@/lib/queryClient';
import { UserCheck, UserX, Clock, Plus } from 'lucide-react';
import ReferralModal from '@/components/referral-modal';

export default function Referrals() {
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const { user, hasAnyRole } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['/api/referrals'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest(`/api/referrals/${id}`, 'PATCH', { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Referral status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update referral status',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="text-green-600 border-green-600"><UserCheck className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><UserX className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canCreateReferrals = hasAnyRole(['nurse', 'doctor', 'admin']);
  const canUpdateReferrals = hasAnyRole(['pharmacist', 'physiotherapist', 'doctor', 'admin']);

  // Filter referrals based on user role
  const filteredReferrals = referrals.filter((referral: any) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'doctor' || user?.role === 'nurse') return true;
    return referral.toRole === user?.role;
  });

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <header className="healthcare-header px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow-sm">Referrals</h2>
              <p className="text-white/90 font-medium">Manage patient referrals between departments</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading referrals...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Fixed Header */}
      <header className="healthcare-header px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white drop-shadow-sm">Referrals</h2>
            <p className="text-white/90 font-medium">Manage patient referrals between departments</p>
          </div>
          {canCreateReferrals && (
            <Button 
              onClick={() => setIsReferralModalOpen(true)} 
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm"
            >
              <Plus className="h-4 w-4" />
              Create Referral
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Referral List</CardTitle>
            <CardDescription>
              {user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse' 
                ? 'All referrals in the system' 
                : `Referrals assigned to ${user?.role}s`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredReferrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No referrals found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To Role</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    {canUpdateReferrals && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral: any) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {referral.patient?.firstName} {referral.patient?.lastName}
                      </TableCell>
                      <TableCell>
                        {referral.fromUser?.username || 'Unknown'}
                      </TableCell>
                      <TableCell className="capitalize">{referral.toRole}</TableCell>
                      <TableCell className="max-w-xs truncate">{referral.reason}</TableCell>
                      <TableCell>
                        {new Date(referral.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      {canUpdateReferrals && (
                        <TableCell>
                          {referral.status === 'pending' && (referral.toRole === user?.role || user?.role === 'admin') && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => updateStatusMutation.mutate({ id: referral.id, status: 'accepted' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => updateStatusMutation.mutate({ id: referral.id, status: 'rejected' })}
                                disabled={updateStatusMutation.isPending}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <ReferralModal
          open={isReferralModalOpen}
          onOpenChange={setIsReferralModalOpen}
        />
      </div>
    </div>
  );
}