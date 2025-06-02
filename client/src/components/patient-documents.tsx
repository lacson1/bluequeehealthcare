import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Plus,
  Calendar,
  User,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import PDFViewer from '@/components/PDFViewer';

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  category: string;
  patientId?: number;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  patient?: {
    firstName: string;
    lastName: string;
  };
}

interface PatientDocumentsProps {
  patientId: number;
  patientName: string;
}

export default function PatientDocuments({ patientId, patientName }: PatientDocumentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all documents for the organization
  const { data: allDocuments = [], isLoading } = useQuery({
    queryKey: ['/api/files/medical'],
  });

  // Filter documents for this specific patient
  const patientDocuments = allDocuments.filter((doc: Document) => 
    doc.patientId === patientId
  );

  // Further filter by category if selected
  const filteredDocuments = selectedCategory && selectedCategory !== 'all' 
    ? patientDocuments.filter((doc: Document) => doc.category === selectedCategory)
    : patientDocuments;

  // Document categories
  const categories = [
    { value: 'lab-results', label: 'Lab Results' },
    { value: 'prescriptions', label: 'Prescriptions' },
    { value: 'medical-records', label: 'Medical Records' },
    { value: 'imaging', label: 'Imaging' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'consent-forms', label: 'Consent Forms' },
    { value: 'referrals', label: 'Referrals' },
    { value: 'other', label: 'Other' }
  ];

  // Get unique categories from patient documents
  const availableCategories = [...new Set(patientDocuments.map((doc: Document) => doc.category))];

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
    mutationFn: async (fileName: string) => {
      const response = await fetch(`/api/files/medical/${fileName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files/medical'] });
      toast({ title: 'Success', description: 'Document deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete document',
        variant: 'destructive'
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadCategory) {
      toast({
        title: 'Error',
        description: 'Please select a file and category',
        variant: 'destructive'
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', uploadCategory);
    formData.append('patientId', patientId.toString());

    uploadDocumentMutation.mutate(formData);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setUploadCategory('');
    setIsUploading(false);
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleView = (document: Document) => {
    setSelectedDocument(document);
    setPdfViewerOpen(true);
  };

  const handleDownload = (fileName: string, originalName: string) => {
    const link = document.createElement('a');
    link.href = `/api/files/medical/${fileName}`;
    link.download = originalName;
    link.click();
  };

  const handlePdfViewerDownload = () => {
    if (selectedDocument) {
      handleDownload(selectedDocument.fileName, selectedDocument.originalName);
    }
  };

  const handleDelete = (fileName: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(fileName);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category.replace('-', ' ');
  };

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Documents for {patientName}</h3>
          <p className="text-sm text-gray-600">Medical records and patient files</p>
        </div>
        <Button onClick={() => setIsUploading(true)} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Label htmlFor="category-filter">Filter by category:</Label>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {availableCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {getCategoryLabel(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Documents ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {selectedCategory ? 
                  `No documents in the "${getCategoryLabel(selectedCategory)}" category for this patient.` :
                  'No documents have been uploaded for this patient yet.'
                }
              </p>
              <Button onClick={() => setIsUploading(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document: Document) => (
                <div key={document.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{document.originalName}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <Badge variant="secondary">
                            {getCategoryLabel(document.category)}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(document.uploadedAt), 'MMM dd, yyyy')}</span>
                          </div>
                          <span>{formatFileSize(document.size)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Uploaded by: {document.uploadedBy}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(document)}
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

      {/* Upload Document Modal */}
      <Dialog open={isUploading} onOpenChange={setIsUploading}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document for {patientName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File</Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-category">Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || !uploadCategory || uploadDocumentMutation.isPending}
              >
                {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}