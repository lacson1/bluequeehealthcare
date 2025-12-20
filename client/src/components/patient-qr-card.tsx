import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  CheckCircle,
  User,
  Calendar,
  Phone,
  Mail,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@shared/schema";

interface PatientQRCardProps {
  patient: Patient;
  baseUrl?: string;
}

export default function PatientQRCard({ patient, baseUrl = window.location.origin }: PatientQRCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const patientUrl = `${baseUrl}/patients/${patient.id}`;
  const patientAge = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(patientUrl);
      setCopied(true);
      toast({
        title: "✅ Link Copied",
        description: "Patient profile link copied to clipboard",
      });
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout with proper cleanup
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "❌ Copy Failed",
        description: "Unable to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadQR = () => {
    // Create a canvas to convert SVG to image
    const svg = document.querySelector(`#qr-${patient.id} svg`) as SVGElement;
    if (svg) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = 200;
        canvas.height = 200;
        ctx?.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `patient-${patient.id}-qr.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        URL.revokeObjectURL(url);
        
        toast({
          title: "📱 QR Code Downloaded",
          description: "Patient QR code saved to downloads",
        });
      };
      
      img.src = url;
    }
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const canvas = document.getElementById(`qr-${patient.id}`) as HTMLCanvasElement;
      const qrImage = canvas.toDataURL();
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Patient QR Code - ${patient.title ? `${patient.title} ` : ''}${patient.firstName} ${patient.lastName}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                background: white;
              }
              .qr-container {
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                margin: 20px auto;
                width: fit-content;
                background: white;
              }
              .patient-info {
                margin-bottom: 15px;
                color: #334155;
              }
              .patient-name {
                font-size: 24px;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 8px;
              }
              .patient-details {
                font-size: 14px;
                margin-bottom: 4px;
              }
              .emergency-info {
                color: #dc2626;
                font-weight: bold;
                margin-top: 15px;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="patient-info">
                <div class="patient-name">${patient.title ? `${patient.title} ` : ''}${patient.firstName} ${patient.lastName}</div>
                <div class="patient-details">ID: HC${patient.id?.toString().padStart(6, "0")} | Age: ${patientAge} | ${patient.gender}</div>
                ${patient.phone ? `<div class="patient-details">Phone: ${patient.phone}</div>` : ''}
                ${patient.allergies ? `<div class="patient-details" style="color: #dc2626;">⚠️ Allergies: ${patient.allergies}</div>` : ''}
              </div>
              <img src="${qrImage}" alt="Patient QR Code" style="width: 200px; height: 200px;" />
              <div class="emergency-info">
                🚨 EMERGENCY ACCESS<br/>
                Scan for instant patient profile
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      
      toast({
        title: "🖨️ Printing QR Code",
        description: "Patient emergency QR code ready for print",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center space-x-2 text-lg">
          <QrCode className="h-5 w-5 text-primary" />
          <span>Emergency QR Access</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Patient Info Summary */}
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-semibold text-slate-800">
              {patient.title ? `${patient.title} ` : ''}{patient.firstName} {patient.lastName}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Calendar className="h-3 w-3" />
            <span>Age: {patientAge} | {patient.gender}</span>
          </div>
          {patient.phone && (
            <a 
              href={`tel:${patient.phone.replace(/\s+/g, '')}`}
              className="flex items-center space-x-2 text-sm text-slate-600 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
              title={`Call ${patient.phone}`}
            >
              <Phone className="h-3 w-3" />
              <span>{patient.phone}</span>
            </a>
          )}
          {patient.email && (
            <a 
              href={`mailto:${patient.email}`}
              className="flex items-center space-x-2 text-sm text-slate-600 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
              title={`Send email to ${patient.email}`}
            >
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[200px]">{patient.email}</span>
            </a>
          )}
          {patient.allergies && (
            <div className="flex items-center space-x-2 text-sm">
              <Heart className="h-3 w-3 text-red-500" />
              <Badge variant="destructive" className="text-xs">
                ⚠️ Allergies: {patient.allergies}
              </Badge>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div id={`qr-${patient.id}`} className="flex justify-center bg-white p-4 rounded-lg border-2 border-slate-200">
          <QRCodeSVG 
            value={patientUrl}
            size={160}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Patient URL */}
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-2">Emergency Access URL:</div>
          <div className="bg-slate-100 p-2 rounded text-xs font-mono break-all">
            {patientUrl}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            className="flex items-center space-x-1"
          >
            {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={downloadQR}
            className="flex items-center space-x-1"
          >
            <Download className="h-3 w-3" />
            <span>Save</span>
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={printQR}
            className="flex items-center space-x-1"
          >
            <Printer className="h-3 w-3" />
            <span>Print</span>
          </Button>
        </div>

        {/* Emergency Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-red-600 font-semibold text-sm">🚨 EMERGENCY ACCESS</div>
          <div className="text-red-500 text-xs mt-1">
            Scan for instant patient profile access during emergencies
          </div>
        </div>
      </CardContent>
    </Card>
  );
}