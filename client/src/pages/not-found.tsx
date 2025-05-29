import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <Card className="w-full max-w-lg shadow-lg border-blue-200">
        <CardHeader className="text-center bg-blue-50 rounded-t-lg">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Page Not Found
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 text-center space-y-4">
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <p className="text-sm text-gray-500">
            You might have mistyped the URL or the page may no longer be available.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => setLocation('/')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium">
              ClinicConnect - Healthcare Management System
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
