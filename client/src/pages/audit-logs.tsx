import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuditLog } from "@shared/schema";
import { Shield, Search, Filter, Calendar, User, Eye } from "lucide-react";

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  // Fetch audit logs
  const { data: auditLogs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter);
    const matchesEntity = entityFilter === "all" || log.entityType === entityFilter;
    
    return matchesSearch && matchesAction && matchesEntity;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("Created")) return "bg-green-100 text-green-800";
    if (action.includes("Updated")) return "bg-blue-100 text-blue-800";
    if (action.includes("Deleted")) return "bg-red-100 text-red-800";
    if (action.includes("Viewed")) return "bg-gray-100 text-gray-800";
    return "bg-purple-100 text-purple-800";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Track all system activities and user actions</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Shield className="w-4 h-4 mr-1" />
          Admin Only
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="Created">Created</SelectItem>
            <SelectItem value="Updated">Updated</SelectItem>
            <SelectItem value="Deleted">Deleted</SelectItem>
            <SelectItem value="Viewed">Viewed</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="patient">Patients</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="visit">Visits</SelectItem>
            <SelectItem value="medicine">Medicines</SelectItem>
            <SelectItem value="prescription">Prescriptions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audit Logs List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
              <p className="text-gray-600">
                {searchTerm || actionFilter !== "all" || entityFilter !== "all" 
                  ? "Try adjusting your search criteria" 
                  : "System activities will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge className={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="text-sm text-gray-500 capitalize">
                        {log.entityType}
                        {log.entityId && ` #${log.entityId}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        User ID: {log.userId}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      {log.ipAddress && (
                        <div>IP: {log.ipAddress}</div>
                      )}
                    </div>
                    
                    {log.details && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {filteredLogs.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {filteredLogs.length} of {auditLogs.length} audit logs
        </div>
      )}
    </div>
  );
}