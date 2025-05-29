import React from 'react';
import { MedicalCalculator } from '@/components/medical-calculator';
import { PatientCommunicationHub } from '@/components/patient-communication-hub';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, MessageSquare } from 'lucide-react';

export function MedicalToolsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Tools</h1>
          <p className="text-gray-600">Clinical calculators and patient communication tools</p>
        </div>
      </div>

      <Tabs defaultValue="calculators" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 gap-2 md:gap-0">
          <TabsTrigger value="calculators" className="flex items-center gap-2 text-sm">
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Medical </span>Calculators
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Patient </span>Communication
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculators" className="mt-6">
          <MedicalCalculator />
        </TabsContent>

        <TabsContent value="communication" className="mt-6">
          <PatientCommunicationHub />
        </TabsContent>
      </Tabs>
    </div>
  );
}