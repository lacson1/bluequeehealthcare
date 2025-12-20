import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { fileStorage } from "../storage-service";
import { db } from "../db";
import { medicalDocuments, patients } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { AuditLogger } from "../audit";
import multer from "multer";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

/**
 * File management routes
 * Handles: file upload, download, delete, medical documents
 */
export function setupFilesRoutes(): Router {
  
  // Upload file
  router.post('/upload/:category', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { category } = req.params;
      const validCategories = ['patients', 'staff', 'organizations', 'documents', 'medical'];

      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'Invalid file category' });
      }

      const fileName = await fileStorage.saveFile(req.file.buffer, req.file.originalname, category as any);
      const fileUrl = fileStorage.getFileUrl(fileName, category as any);

      return res.json({
        fileName,
        fileUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // File Download/Serve Endpoint
  router.get('/files/:category/:fileName', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { category, fileName } = req.params;
      const validCategories = ['patients', 'staff', 'organizations', 'documents', 'medical'];

      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'Invalid file category' });
      }

      const fileBuffer = await fileStorage.getFile(fileName, category as any);
      if (!fileBuffer) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(fileBuffer);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to retrieve file' });
    }
  });

  // Delete File Endpoint
  router.delete('/files/:category/:fileName', authenticateToken, requireAnyRole(['admin', 'doctor']), async (req: AuthRequest, res) => {
    try {
      const { category, fileName } = req.params;
      const validCategories = ['patients', 'staff', 'organizations', 'documents'];

      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'Invalid file category' });
      }

      const deleted = await fileStorage.deleteFile(fileName, category as any);
      if (!deleted) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logSystemAction('file_deleted', {
        category,
        fileName
      });

      return res.json({ message: 'File deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to delete file' });
    }
  });

  // Get all medical documents for organization
  router.get("/files/medical", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const organizationId = req.user?.organizationId || 1;

      const documents = await db
        .select()
        .from(medicalDocuments)
        .where(eq(medicalDocuments.organizationId, organizationId))
        .orderBy(desc(medicalDocuments.uploadedAt));

      // Get patient info for documents that have patientId
      const documentsWithPatients = await Promise.all(
        documents.map(async (doc) => {
          if (doc.patientId) {
            const [patient] = await db
              .select({ firstName: patients.firstName, lastName: patients.lastName })
              .from(patients)
              .where(eq(patients.id, doc.patientId));

            return {
              ...doc,
              patient: patient || null
            };
          }
          return { ...doc, patient: null };
        })
      );

      return res.json(documentsWithPatients);
    } catch (error) {
      console.error('Error fetching medical documents:', error);
      return res.status(500).json({ message: "Failed to fetch medical documents" });
    }
  });

  // Upload medical document
  router.post("/upload/medical", authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { category, patientId } = req.body;

      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalExtension = req.file.originalname.split('.').pop();
      const fileName = `medical_${timestamp}_${Math.random().toString(36).substring(7)}.${originalExtension}`;

      // Store file in uploads directory
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(process.cwd(), 'uploads', 'medical');

      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      // Save to database
      const organizationId = req.user?.organizationId || 1;
      const [document] = await db
        .insert(medicalDocuments)
        .values({
          fileName,
          originalName: req.file.originalname,
          category,
          patientId: patientId ? parseInt(patientId) : null,
          uploadedBy: req.user!.id,
          size: req.file.size,
          mimeType: req.file.mimetype,
          organizationId
        })
        .returning();

      res.json({
        id: document.id,
        fileName: document.fileName,
        originalName: document.originalName,
        category: document.category,
        size: document.size,
        uploadedAt: document.uploadedAt
      });
    } catch (error) {
      console.error('Error uploading medical document:', error);
      return res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Serve medical document files
  router.get("/files/medical/:fileName", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { fileName } = req.params;
      const download = req.query.download === 'true';
      const organizationId = req.user?.organizationId || 1;

      // Verify document belongs to user's organization
      const [document] = await db
        .select()
        .from(medicalDocuments)
        .where(and(
          eq(medicalDocuments.fileName, fileName),
          eq(medicalDocuments.organizationId, organizationId)
        ));

      if (!document) {
        return res.status(404).json({ message: "Document not found in database" });
      }

      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.default.join(process.cwd(), 'uploads', 'medical', fileName);

      const fileExists = fs.default.existsSync(filePath);
      if (!fileExists) {
        // Clean up orphaned database record
        await db.delete(medicalDocuments)
          .where(eq(medicalDocuments.fileName, fileName));
        return res.status(404).json({ message: "File not found - database record cleaned up" });
      }

      // Set appropriate headers for different use cases
      if (document.mimeType === 'text/plain') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      } else {
        res.setHeader('Content-Type', document.mimeType);
      }

      // Set disposition based on download parameter
      if (download) {
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
        // Add headers to allow iframe embedding for preview
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
      }

      const fileStream = fs.default.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving medical document:', error);
      return res.status(500).json({ message: "Failed to serve document" });
    }
  });

  // Delete medical document
  router.delete("/files/medical/:fileName", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { fileName } = req.params;
      const organizationId = req.user?.organizationId || 1;

      // Verify document belongs to user's organization
      const [document] = await db
        .select()
        .from(medicalDocuments)
        .where(and(
          eq(medicalDocuments.fileName, fileName),
          eq(medicalDocuments.organizationId, organizationId)
        ));

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Delete file from filesystem
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.default.join(process.cwd(), 'uploads', 'medical', fileName);

      if (fs.default.existsSync(filePath)) {
        fs.default.unlinkSync(filePath);
      }

      // Delete from database
      await db.delete(medicalDocuments)
        .where(eq(medicalDocuments.fileName, fileName));

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logSystemAction('medical_document_deleted', {
        fileName,
        documentId: document.id
      });

      return res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting medical document:', error);
      return res.status(500).json({ message: "Failed to delete document" });
    }
  });

  return router;
}

