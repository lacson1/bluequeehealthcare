import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Clock, Edit, FileText, MoreVertical, Printer, QrCode, RefreshCw, UserCheck, XCircle } from "lucide-react";

interface PrescriptionCardProps {
  prescription: any;
  variant: 'active' | 'past' | 'repeat';
  onEdit?: (prescription: any) => void;
  onPrint?: (prescription: any) => void;
  onReorder?: (prescription: any) => void;
  onScheduleReview?: (prescriptionId: number, medicationName: string) => void;
  onIssueRepeat?: (prescriptionId: number, medicationName: string) => void;
  onUpdateStatus?: (prescriptionId: number, status: string) => void;
  onGenerateQR?: (prescription: any) => void;
}

export function PrescriptionCard({
  prescription,
  variant,
  onEdit,
  onPrint,
  onReorder,
  onScheduleReview,
  onIssueRepeat,
  onUpdateStatus,
  onGenerateQR
}: PrescriptionCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'active':
        return {
          container: "border border-blue-200 rounded-lg p-4 bg-blue-50",
          badge: "bg-blue-100 text-blue-800 border-blue-200",
          badgeText: "Active"
        };
      case 'past':
        return {
          container: "border border-gray-200 rounded-lg p-4 bg-gray-50",
          badge: "bg-gray-100 text-gray-800 border-gray-200",
          badgeText: "Completed"
        };
      case 'repeat':
        return {
          container: "border border-green-200 rounded-lg p-4 bg-green-50",
          badge: "bg-green-100 text-green-800 border-green-200",
          badgeText: "Repeat Prescription"
        };
      default:
        return {
          container: "border border-gray-200 rounded-lg p-4 bg-white",
          badge: "bg-gray-100 text-gray-800 border-gray-200",
          badgeText: "Unknown"
        };
    }
  };

  const styles = getVariantStyles();

  const renderActions = () => {
    switch (variant) {
      case 'active':
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-blue-600 hover:text-blue-800 border-blue-200"
              onClick={() => onEdit?.(prescription)}
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-green-600 hover:text-green-800 border-green-200"
              onClick={() => {
                console.log('QR Code button clicked!', prescription);
                onGenerateQR?.(prescription);
              }}
            >
              <QrCode className="w-3 h-3 mr-1" />
              QR Code
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-800"
              onClick={() => onPrint?.(prescription)}
            >
              <Printer className="w-3 h-3 mr-1" />
              Print
            </Button>
          </div>
        );
      
      case 'past':
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-blue-600 hover:text-blue-800 border-blue-200"
              onClick={() => onReorder?.(prescription)}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reorder
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-800"
              onClick={() => onPrint?.(prescription)}
            >
              <Printer className="w-3 h-3 mr-1" />
              Print
            </Button>
          </div>
        );
      
      case 'repeat':
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-blue-600 hover:text-blue-800 border-blue-200"
              onClick={() => onScheduleReview?.(prescription.id, prescription.medicationName)}
            >
              <UserCheck className="w-3 h-3 mr-1" />
              Schedule Review
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-green-600 hover:text-green-800 border-green-200"
              onClick={() => onIssueRepeat?.(prescription.id, prescription.medicationName)}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Issue Repeat
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem onClick={() => onEdit?.(prescription)}>
                  <Edit className="w-3 h-3 mr-2" />
                  Edit Repeat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrint?.(prescription)}>
                  <Printer className="w-3 h-3 mr-2" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUpdateStatus?.(prescription.id, 'discontinued')}>
                  <XCircle className="w-3 h-3 mr-2 text-red-600" />
                  Stop Repeat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className={`font-semibold text-lg ${
              variant === 'repeat' ? 'text-green-800' : 
              variant === 'active' ? 'text-blue-800' : 'text-gray-700'
            }`}>
              {prescription.medicationName}
            </h4>
            <Badge className={styles.badge}>
              {styles.badgeText}
            </Badge>
            {variant === 'repeat' && prescription.reviewDate && (
              <Badge variant="outline" className={`text-xs ${
                new Date(prescription.reviewDate) < new Date() 
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
                {new Date(prescription.reviewDate) < new Date() 
                  ? 'Review Overdue' 
                  : `Review Due: ${new Date(prescription.reviewDate).toLocaleDateString()}`
                }
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
            <div className="bg-white p-3 rounded-md border">
              <span className="font-medium text-gray-700 block">Dosage</span>
              <p className="text-gray-800 mt-1">{prescription.dosage}</p>
            </div>
            <div className="bg-white p-3 rounded-md border">
              <span className="font-medium text-gray-700 block">Frequency</span>
              <p className="text-gray-800 mt-1">{prescription.frequency}</p>
            </div>
            <div className="bg-white p-3 rounded-md border">
              <span className="font-medium text-gray-700 block">Duration</span>
              <p className="text-gray-800 mt-1">{prescription.duration}</p>
            </div>
            <div className="bg-white p-3 rounded-md border">
              <span className="font-medium text-gray-700 block">Prescribed by</span>
              <p className="text-gray-800 mt-1">{prescription.prescribedBy}</p>
            </div>
          </div>
          
          {prescription.instructions && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
              <span className="font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Instructions
              </span>
              <p className="text-gray-800 mt-2">{prescription.instructions}</p>
            </div>
          )}
          
          <div className={`flex items-center justify-between mt-4 pt-3 border-t ${
            variant === 'repeat' ? 'border-green-200' : 
            variant === 'active' ? 'border-blue-200' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Started: {new Date(prescription.startDate).toLocaleDateString()}</span>
              </div>
              {prescription.lastReviewDate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Last Review: {new Date(prescription.lastReviewDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            {renderActions()}
          </div>
        </div>
      </div>
    </div>
  );
}