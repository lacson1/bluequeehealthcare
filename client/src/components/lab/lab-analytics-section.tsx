import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestTube, CheckCircle, Clock, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";

interface LabAnalyticsSectionProps {
  analytics: any;
  testCategories: string[];
  labOrders: any[];
}

export function LabAnalyticsSection({
  analytics,
  testCategories,
  labOrders
}: LabAnalyticsSectionProps) {
  if (!analytics) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-600">Laboratory performance insights and metrics</p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-full">
          <CardContent className="p-4 h-full flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(analytics as any).metrics?.totalOrders || '0'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full flex-shrink-0 ml-4">
                <TestTube className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="p-4 h-full flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {(analytics as any).metrics?.completedOrders || '0'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full flex-shrink-0 ml-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="p-4 h-full flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(analytics as any).metrics?.pendingOrders || '0'}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full flex-shrink-0 ml-4">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="p-4 h-full flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Critical Results</p>
                <p className="text-2xl font-bold text-red-600">
                  {(analytics as any).metrics?.criticalResults || '0'}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full flex-shrink-0 ml-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Volume by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5" />
              Test Volume by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {testCategories.slice(0, 5).map((category) => {
                const categoryCount = labOrders.reduce((count, order) =>
                  count + (Array.isArray(order.items) && order.items.some((item: any) =>
                    (item.labTest?.category || item.testCategory || 'Hematology') === category
                  ) ? 1 : 0), 0
                );
                const percentage = labOrders.length > 0
                  ? (categoryCount / labOrders.length) * 100
                  : 0;

                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{category}</span>
                      <span className="text-gray-600">{categoryCount} tests</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

