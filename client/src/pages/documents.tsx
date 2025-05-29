import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, Search, User, Download, Trash2, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

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
  patient?: Patient;
}

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
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
      const response = await fetch('/api/upload/medical', {
        method: 'POST',
        body: data,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Upload failed');
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
    mutationFn: (fileName: string) => apiRequest('DELETE', `/api/files/medical/${fileName}`),
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

  const handleDownload = (fileName: string, originalName: string) => {
    const link = document.createElement('a');
    link.href = `/api/files/medical/${fileName}`;
    link.download = originalName;
    link.click();
  };

  const handleDelete = (fileName: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(fileName);
    }
  };

  const handleView = (fileName: string) => {
    window.open(`/api/files/medical/${fileName}`, '_blank');
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc: Document) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Upload and manage patient documents</p>
        </div>
        <Button onClick={() => setIsUploading(true)} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

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
  );
}