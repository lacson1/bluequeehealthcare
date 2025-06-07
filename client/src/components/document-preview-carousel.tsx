import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MedicalIcons } from '@/lib/medical-icons';
import { FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface Document {
  id: number;
  fileName: string;
  originalName: string;
  category: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  description?: string;
  uploadedBy: number;
}

interface DocumentPreviewCarouselProps {
  patientId: number;
  isOpen: boolean;
  onClose: () => void;
  initialDocumentIndex?: number;
}

export function DocumentPreviewCarousel({ 
  patientId, 
  isOpen, 
  onClose, 
  initialDocumentIndex = 0 
}: DocumentPreviewCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialDocumentIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch patient documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: [`/api/patients/${patientId}/documents`],
    enabled: isOpen && !!patientId,
  });

  // Reset index when documents change or dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(initialDocumentIndex, documents.length - 1));
    }
  }, [isOpen, initialDocumentIndex, documents.length]);

  const currentDocument = documents[currentIndex];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % documents.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + documents.length) % documents.length);
  };

  const goToDocument = (index: number) => {
    setCurrentIndex(index);
  };

  const downloadDocument = async (doc: Document) => {
    try {
      const token = localStorage.getItem('clinic_token');
      const response = await fetch(`/api/files/medical/${doc.fileName}?download=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const getDocumentIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'lab-result':
        return <MedicalIcons.bloodTest className="w-5 h-5" />;
      case 'imaging':
        return <MedicalIcons.image className="w-5 h-5" />;
      case 'prescription':
        return <MedicalIcons.medication className="w-5 h-5" />;
      case 'medical-record':
        return <MedicalIcons.medicalRecord className="w-5 h-5" />;
      case 'discharge-summary':
        return <MedicalIcons.document className="w-5 h-5" />;
      case 'referral':
        return <MedicalIcons.referral className="w-5 h-5" />;
      case 'insurance':
        return <MedicalIcons.billing className="w-5 h-5" />;
      default:
        return <MedicalIcons.document className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'lab-result':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'imaging':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prescription':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'medical-record':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'discharge-summary':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'referral':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'insurance':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAuthenticatedFileUrl = async (fileName: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/files/medical/${fileName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.error('Error loading file:', error);
    }
    return null;
  };

  const renderDocumentPreview = (doc: Document) => {
    if (doc.mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <div className="text-center p-8">
            <MedicalIcons.image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{doc.originalName}</h3>
            <p className="text-sm text-gray-500 mb-4">Image preview requires authentication</p>
            <Button
              onClick={() => downloadDocument(doc)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MedicalIcons.download className="w-4 h-4 mr-2" />
              Download Image
            </Button>
          </div>
        </div>
      );
    } else if (doc.mimeType === 'application/pdf') {
      return (
        <div className="flex flex-col h-full bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center p-3 border-b bg-white rounded-t-lg">
            <span className="text-sm font-medium text-gray-700">{doc.originalName}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadDocument(doc)}
                className="text-xs"
              >
                Download
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('clinic_token');
                    const response = await fetch(`/api/files/medical/${doc.fileName}`, {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                      setTimeout(() => URL.revokeObjectURL(url), 10000);
                    }
                  } catch (error) {
                    console.error('Error opening PDF:', error);
                  }
                }}
                className="text-xs"
              >
                View PDF
              </Button>
            </div>
          </div>
          <div className="flex-1 p-2">
            <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded border-2 border-dashed border-gray-300">
              <div className="text-center p-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{doc.originalName}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  PDF Document • {(doc.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-gray-400 mb-6">
                  Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('clinic_token');
                        const response = await fetch(`/api/files/medical/${doc.fileName}`, {
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        
                        if (response.ok) {
                          const blob = await response.blob();
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                          setTimeout(() => URL.revokeObjectURL(url), 10000);
                        }
                      } catch (error) {
                        console.error('Error opening PDF:', error);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Open PDF in New Tab
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `${fileUrl}?download=true`;
                      link.download = doc.originalName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-8">
          <div className="text-center">
            {getDocumentIcon(doc.category)}
            <h3 className="mt-4 text-lg font-medium text-gray-900">{doc.originalName}</h3>
            <p className="mt-2 text-sm text-gray-500">
              {doc.mimeType} • {(doc.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
            </p>
            <Button
              onClick={() => downloadDocument(doc)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              <MedicalIcons.download className="w-4 h-4 mr-2" />
              Download to View
            </Button>
          </div>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Loading Documents</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-full">
            <MedicalIcons.clock className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading documents...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!documents.length) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>No Documents Found</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12">
            <MedicalIcons.medicalRecord className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">No documents have been uploaded for this patient yet.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-[95vw] h-[95vh]' : 'max-w-6xl h-[80vh]'} p-0`}>
        <DialogHeader className="sr-only">
          <DialogTitle>Document Preview - {currentDocument.originalName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getDocumentIcon(currentDocument.category)}
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentDocument.originalName}
                </h2>
              </div>
              <Badge className={`${getCategoryColor(currentDocument.category)} border`}>
                {currentDocument.category.replace('-', ' ')}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {currentIndex + 1} of {documents.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <MedicalIcons.minimize className="w-4 h-4" />
                ) : (
                  <MedicalIcons.maximize className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadDocument(currentDocument)}
              >
                <MedicalIcons.download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Document Preview */}
            <div className="flex-1 p-4">
              {renderDocumentPreview(currentDocument)}
            </div>

            {/* Sidebar - Document List */}
            <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">All Documents</h3>
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <Card
                      key={doc.id}
                      className={`cursor-pointer transition-all ${
                        index === currentIndex
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-white'
                      }`}
                      onClick={() => goToDocument(index)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {getDocumentIcon(doc.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.originalName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs ${getCategoryColor(doc.category)} border`}>
                                {doc.category.replace('-', ' ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                            </p>
                            {doc.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between p-4 border-t bg-white rounded-b-lg">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={documents.length <= 1}
              >
                <MedicalIcons.chevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={documents.length <= 1}
              >
                Next
                <MedicalIcons.chevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{(currentDocument.size / 1024 / 1024).toFixed(2)} MB</span>
              <span>•</span>
              <span>Uploaded {format(new Date(currentDocument.uploadedAt), 'MMM d, yyyy')}</span>
              {currentDocument.description && (
                <>
                  <span>•</span>
                  <span className="max-w-xs truncate">{currentDocument.description}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}