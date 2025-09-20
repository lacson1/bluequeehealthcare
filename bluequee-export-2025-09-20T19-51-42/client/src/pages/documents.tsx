import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, Search, User, Download, Trash2, Eye, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { DocumentPreviewCarousel } from '@/components/document-preview-carousel';

// Simple PDF viewer with direct URL
function SimplePDFViewer({ pdfUrl, documentName }: { pdfUrl: string; documentName: string }) {
  const openPDFDirectly = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="w-full h-full">
      <iframe
        src={pdfUrl}
        className="w-full h-full border-0"
        title={documentName}
        style={{ height: 'calc(600px - 48px)' }}
        onError={openPDFDirectly}
      />
    </div>
  );
}

// Enhanced Document Viewer for PDF and Image files
function AuthenticatedDocumentViewer({ document, onDownload }: { 
  document: Document; 
  onDownload: (fileName: string, originalName: string) => void; 
}) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'iframe' | 'object' | 'embed' | 'pdfjs' | 'text'>('iframe');
  const [retryCount, setRetryCount] = useState(0);
  
  const isImage = document.mimeType?.startsWith('image/');
  const isPDF = document.mimeType === 'application/pdf';

  const loadDocument = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('clinic_token');
      if (!token) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/files/medical/${document.fileName}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setFileUrl(url);
        setRetryCount(0);
      } else if (response.status === 401 && retryCount < 2) {
        // Retry with fresh auth
        setRetryCount(prev => prev + 1);
        setTimeout(loadDocument, 1000);
        return;
      } else {
        setError(`Failed to load document (${response.status})`);
      }
    } catch (err) {
      setError('Network error loading document');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();

    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [document.fileName, retryCount]);

  if (isLoading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center">
          <File className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading {isImage ? 'image' : 'document'}...</p>
        </div>
      </div>
    );
  }

  const openInNewTab = async () => {
    try {
      const token = localStorage.getItem('clinic_token');
      const response = await fetch(`/api/files/medical/${document.fileName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (error) {
      console.error('Error opening document:', error);
    }
  };

  const renderDocumentViewer = () => {
    if (!fileUrl) return null;

    // Render images
    if (isImage) {
      return (
        <div className="flex justify-center items-center h-full p-4">
          <img 
            src={fileUrl} 
            alt={document.originalName}
            className="max-w-full max-h-full object-contain rounded shadow-lg"
          />
        </div>
      );
    }

    // Render PDFs
    switch (viewMode) {
      case 'pdfjs':
        return <SimplePDFViewer pdfUrl={fileUrl} documentName={document.originalName} />;
      case 'object':
        return (
          <object
            data={fileUrl}
            type="application/pdf"
            className="w-full h-full"
            style={{ height: 'calc(600px - 48px)' }}
          >
            <div className="flex flex-col items-center justify-center h-full p-8">
              <File className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">PDF cannot be displayed with Object tag</p>
              <Button onClick={openInNewTab} size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </object>
        );
      case 'embed':
        return (
          <embed
            src={fileUrl}
            type="application/pdf"
            className="w-full h-full"
            style={{ height: 'calc(600px - 48px)' }}
          />
        );
      case 'text':
        return (
          <div className="w-full h-full p-4 bg-gray-50 overflow-auto" style={{ height: 'calc(600px - 48px)' }}>
            <div className="bg-white rounded p-6 shadow">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Document</h3>
                  <p className="text-gray-600 mb-4">{document.originalName}</p>
                  <p className="text-sm text-gray-500 mb-6">
                    Size: {(document.size / 1024 / 1024).toFixed(2)} MB<br/>
                    Type: {document.mimeType}<br/>
                    Uploaded: {format(new Date(document.uploadedAt), 'MMM d, yyyy')}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={openInNewTab} size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                    <Button onClick={() => onDownload(document.fileName, document.originalName)} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        // Standard iframe PDF viewer
        return (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={document.originalName}
            style={{ height: 'calc(600px - 48px)' }}
          />
        );
    }
  };

  if (error || !fileUrl) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-300">
        <div className="text-center p-8">
          <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{document.originalName}</h3>
          <p className="text-sm text-gray-500 mb-2">
            {document.mimeType} • {(document.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Uploaded {format(new Date(document.uploadedAt), 'MMM d, yyyy')}
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <div className="flex gap-3 justify-center mb-4">
            <Button onClick={openInNewTab} className="bg-blue-600 hover:bg-blue-700">
              <Eye className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
            <Button variant="outline" onClick={() => onDownload(document.fileName, document.originalName)}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
          {error && (
            <Button variant="outline" size="sm" onClick={loadDocument}>
              Retry Loading
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-white rounded border">
      <div className="flex justify-between items-center p-2 border-b bg-gray-50">
        <span className="text-sm font-medium">{document.originalName}</span>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 mr-2">
            <Button
              size="sm"
              variant={viewMode === 'iframe' ? 'default' : 'outline'}
              onClick={() => setViewMode('iframe')}
              className="text-xs px-2"
            >
              iFrame
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'pdfjs' ? 'default' : 'outline'}
              onClick={() => setViewMode('pdfjs')}
              className="text-xs px-2"
            >
              PDF.js
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'object' ? 'default' : 'outline'}
              onClick={() => setViewMode('object')}
              className="text-xs px-2"
            >
              Object
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'embed' ? 'default' : 'outline'}
              onClick={() => setViewMode('embed')}
              className="text-xs px-2"
            >
              Embed
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'text' ? 'default' : 'outline'}
              onClick={() => setViewMode('text')}
              className="text-xs px-2"
            >
              Info
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={openInNewTab}>
            <Eye className="w-3 h-3 mr-1" />
            New Tab
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDownload(document.fileName, document.originalName)}>
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>
      </div>
      {renderDocumentViewer()}
    </div>
  );
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  category: string;
  patientId?: number;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  mimeType: string;
  patient?: Patient;
}

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Get URL params for pre-filled patient
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledPatientId = urlParams.get('patientId');

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/files/medical'],
  });

  // Fetch patients for selection
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const token = localStorage.getItem('clinic_token');
      const response = await fetch('/api/upload/medical', {
        method: 'POST',
        body: data,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files/medical'] });
      toast({ title: 'Success', description: 'Document uploaded successfully' });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to upload document',
        variant: 'destructive'
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: (fileName: string) => apiRequest(`/api/files/medical/${fileName}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files/medical'] });
      toast({ title: 'Success', description: 'Document deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to delete document',
        variant: 'destructive'
      });
    },
  });

  const resetForm = () => {
    setSelectedFile(null);
    setUploadCategory('');
    setSelectedPatient(null);
    setIsUploading(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select a file smaller than 10MB',
          variant: 'destructive'
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadCategory) {
      toast({
        title: 'Validation Error',
        description: 'Please select a file and category',
        variant: 'destructive'
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', uploadCategory);
    if (selectedPatient) {
      formData.append('patientId', selectedPatient.toString());
    }

    uploadDocumentMutation.mutate(formData);
  };

  const handleDownload = async (fileName: string, originalName: string) => {
    try {
      const token = localStorage.getItem('clinic_token');
      const response = await fetch(`/api/files/medical/${fileName}?download=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download the document',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = (fileName: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(fileName);
    }
  };

  const handleView = (fileName: string) => {
    const document = (documents as Document[]).find((doc: Document) => doc.fileName === fileName);
    if (document) {
      setPreviewDocument(document);
      setIsPreviewOpen(true);
    }
  };

  // Filter documents
  const filteredDocuments = (documents as Document[]).filter((doc: Document) => {
    if (searchTerm && !doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !doc.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !doc.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedCategory && selectedCategory !== 'all' && doc.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  // Pre-fill patient if coming from patient profile
  React.useEffect(() => {
    if (prefilledPatientId) {
      setSelectedPatient(parseInt(prefilledPatientId));
      setIsUploading(true);
    }
  }, [prefilledPatientId]);

  // Document categories
  const categories = [
    'lab-results',
    'prescriptions',
    'medical-records',
    'imaging',
    'insurance',
    'consent-forms',
    'referrals',
    'other'
  ];

  // Get unique categories from documents
  const documentCategories = [...new Set(documents.map((doc: Document) => doc.category))];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Fixed Header */}
      <header className="healthcare-header px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white drop-shadow-sm">Document Management</h2>
            <p className="text-white/90 font-medium">Upload and manage patient documents</p>
          </div>
          <Button onClick={() => setIsUploading(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {documentCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Upload Document Form */}
      {isUploading && (
        <Card>
          <CardHeader>
            <CardTitle>Upload New Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient (Optional)</Label>
                <Select value={selectedPatient?.toString() || 'none'} onValueChange={(value) => setSelectedPatient(value === 'none' ? null : parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific patient</SelectItem>
                    {patients.map((patient: Patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Document File *</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500">
                Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT (Max 10MB)
              </p>
              {selectedFile && (
                <div className="text-sm text-blue-600">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleUpload}
                disabled={uploadDocumentMutation.isPending || !selectedFile}
              >
                {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload Document'}
              </Button>
              <Button variant="outline" onClick={() => setIsUploading(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="text-center py-8">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document: Document) => (
                <div key={document.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <File className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{document.originalName}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize">{document.category.replace('-', ' ')}</span>
                          {document.patient && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{document.patient.firstName} {document.patient.lastName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(document.uploadedAt), 'MMM dd, yyyy')}</span>
                          </div>
                          <span>{formatFileSize(document.size)}</span>
                        </div>
                        <p className="text-xs text-gray-400">Uploaded by: {document.uploadedBy}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(document.fileName)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(document.fileName, document.originalName)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(document.fileName)}
                        disabled={deleteDocumentMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] w-full mx-4 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{previewDocument.originalName}</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(previewDocument.fileName, previewDocument.originalName)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setPreviewDocument(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 p-4">
              <AuthenticatedDocumentViewer document={previewDocument} onDownload={handleDownload} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}