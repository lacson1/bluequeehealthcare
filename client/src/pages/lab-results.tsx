import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestTube, Plus } from "lucide-react";
import LabResultEntry from "@/components/lab-result-entry";
import LabOrderForm from "@/components/lab-order-form";
import { useRole } from "@/components/role-guard";

export default function LabResults() {
  const { user } = useRole();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <TestTube className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Laboratory Results</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage pending lab orders and enter test results
            </p>
          </div>
        </div>
      </header>

      <main className="p-6">
        {user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse' ? (
          <Tabs defaultValue="order" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="order" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Order Lab Tests
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                Add Results
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="order" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Order Laboratory Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LabOrderForm patientId={0} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="results" className="mt-6">
              <LabResultEntry />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Access Restricted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You don't have permission to access the laboratory results management system. 
                Please contact your administrator if you need access.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}