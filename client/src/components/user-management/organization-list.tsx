import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Building } from "lucide-react";

interface Organization {
  id: number;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  userCount?: number;
  createdAt: string;
}

interface OrganizationListProps {
  organizations: Organization[];
  onEditOrganization: (org: Organization) => void;
  onCreateOrganization: () => void;
}

export function OrganizationList({
  organizations,
  onEditOrganization,
  onCreateOrganization
}: OrganizationListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Organization Management</h3>
          <p className="text-sm text-gray-600">Manage multi-tenant organizations and their settings</p>
        </div>
        <Button onClick={onCreateOrganization}>
          <Building className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations.map((org: Organization) => (
          <Card key={org.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                  <p className="text-sm text-gray-600 capitalize">{org.type.replace('_', ' ')}</p>
                </div>
                <div className="flex gap-1">
                  <Badge variant={org.isActive ? "default" : "secondary"}>
                    {org.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => onEditOrganization(org)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {org.address && (
                  <p className="text-gray-600">{org.address}</p>
                )}
                {org.phone && (
                  <p className="text-gray-600">📞 {org.phone}</p>
                )}
                {org.email && (
                  <p className="text-gray-600">✉️ {org.email}</p>
                )}
                <div className="flex justify-between pt-2">
                  <span className="text-gray-600">Users:</span>
                  <span className="font-medium">{org.userCount || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

