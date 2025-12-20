import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, Crown } from "lucide-react";

interface User {
  id: number;
  username: string;
  title?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  organizationId: number;
  organizationName?: string;
  isActive?: boolean;
  createdAt: string;
}

interface Organization {
  id: number;
  name: string;
}

interface UserListProps {
  users: User[];
  filteredUsers: User[];
  usersLoading: boolean;
  selectedUsers: number[];
  organizations: Organization[];
  searchTerm: string;
  filterRole: string;
  filterOrg: string;
  onSearchChange: (value: string) => void;
  onFilterRoleChange: (value: string) => void;
  onFilterOrgChange: (value: string) => void;
  onToggleUserSelection: (userId: number) => void;
  onSelectAllUsers: () => void;
  onClearUserSelection: () => void;
  onEditUser: (user: User) => void;
  getRoleColor: (role: string) => string;
  getOrgName: (orgId: number) => string;
  onCreateUser: () => void;
}

export function UserList({
  users,
  filteredUsers,
  usersLoading,
  selectedUsers,
  organizations,
  searchTerm,
  filterRole,
  filterOrg,
  onSearchChange,
  onFilterRoleChange,
  onFilterOrgChange,
  onToggleUserSelection,
  onSelectAllUsers,
  onClearUserSelection,
  onEditUser,
  getRoleColor,
  getOrgName,
  onCreateUser
}: UserListProps) {
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={filterRole} onValueChange={onFilterRoleChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="nurse">Nurse</SelectItem>
              <SelectItem value="pharmacist">Pharmacist</SelectItem>
              <SelectItem value="physiotherapist">Physiotherapist</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterOrg} onValueChange={onFilterOrgChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map((org: Organization) => (
                <SelectItem key={org.id} value={org.id.toString()}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onCreateUser}>
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectAllUsers();
                      } else {
                        onClearUserSelection();
                      }
                    }}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => onToggleUserSelection(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.title} {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                        {user.role === 'admin' && (
                          <Crown className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getOrgName(user.organizationId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.email && <div>{user.email}</div>}
                        {user.phone && <div className="text-gray-500">{user.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditUser(user)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

