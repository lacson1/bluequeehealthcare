import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { insertLabResultSchema, labResults, patients } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";

const router = Router();

/**
 * Lab Results management routes
 * Handles: lab result CRUD, bulk operations, review workflow
 */
export function setupLabResultsRoutes(): Router {
  
  // Get reviewed lab results with pagination
  router.get('/lab-results/reviewed', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      const { patientId, page = '1', limit = '25' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 items per page
      const offset = (pageNum - 1) * limitNum;
      
      // Build optimized query with indexed columns
      let whereConditions = [eq(labResults.organizationId, userOrgId)];
      if (patientId) {
        whereConditions.push(eq(labResults.patientId, parseInt(patientId as string)));
      }
      
      // Use Promise.all for parallel execution
      const [reviewedResults, totalCount] = await Promise.all([
        db.select({
          id: labResults.id,
          patientId: labResults.patientId,
          patientName: sql<string>`CONCAT(${patients.firstName}, ' ', ${patients.lastName})`,
          testName: labResults.testName,
          result: labResults.result,
          normalRange: labResults.normalRange,
          status: labResults.status,
          testDate: labResults.testDate,
          notes: labResults.notes,
          createdAt: labResults.createdAt
        })
        .from(labResults)
        .innerJoin(patients, eq(labResults.patientId, patients.id))
        .where(and(...whereConditions))
        .orderBy(desc(labResults.createdAt))
        .limit(limitNum)
        .offset(offset),
        
        db.select({ count: sql<number>`count(*)` })
        .from(labResults)
        .innerJoin(patients, eq(labResults.patientId, patients.id))
        .where(and(...whereConditions))
        .then(result => result[0]?.count || 0)
      ]);
      
      // Transform data efficiently
      const transformedResults = reviewedResults.map(result => ({
        id: result.id,
        orderId: null,
        patientId: result.patientId,
        patientName: result.patientName,
        testName: result.testName,
        result: result.result,
        normalRange: result.normalRange || 'See lab standards',
        status: result.status,
        completedDate: result.testDate,
        reviewedBy: 'Lab Staff',
        category: 'General',
        units: '',
        remarks: result.notes
      }));
      
      // Add performance headers
      res.set({
        'Cache-Control': 'private, max-age=30',
        'X-Total-Count': totalCount.toString(),
        'X-Page': pageNum.toString(),
        'X-Per-Page': limitNum.toString()
      });
      
      res.json({
        data: transformedResults,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        }
      });
    } catch (error) {
      console.error("Error fetching reviewed lab results:", error);
      res.status(500).json({ message: "Failed to fetch reviewed lab results" });
    }
  });

  // Bulk save lab results endpoint for performance
  router.post('/lab-results/bulk-save', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      const { results } = req.body;
      if (!Array.isArray(results) || results.length === 0) {
        return res.status(400).json({ message: "Results array is required" });
      }
      
      // Validate and prepare data for bulk insert
      const validatedResults = results.map(result => ({
        patientId: result.patientId,
        testName: result.testName,
        result: result.result,
        normalRange: result.normalRange || null,
        status: result.status || 'completed',
        notes: result.notes || null,
        organizationId: userOrgId,
        testDate: result.testDate ? new Date(result.testDate) : new Date()
      }));
      
      // Bulk insert for better performance
      const savedResults = await db.insert(labResults)
        .values(validatedResults)
        .returning();
      
      res.json({
        message: `Successfully saved ${savedResults.length} lab results`,
        results: savedResults
      });
    } catch (error) {
      console.error("Error bulk saving lab results:", error);
      res.status(500).json({ message: "Failed to save lab results" });
    }
  });

  // Single lab result save/update endpoint
  router.post('/lab-results/save', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      const { id, patientId, testName, result, normalRange, status, notes, testDate } = req.body;
      
      const resultData = {
        patientId: parseInt(patientId),
        testName,
        result,
        normalRange: normalRange || null,
        status: status || 'completed',
        notes: notes || null,
        organizationId: userOrgId,
        testDate: testDate ? new Date(testDate) : new Date()
      };
      
      let savedResult;
      if (id) {
        // Update existing result
        [savedResult] = await db.update(labResults)
          .set(resultData)
          .where(and(eq(labResults.id, parseInt(id)), eq(labResults.organizationId, userOrgId)))
          .returning();
      } else {
        // Create new result
        [savedResult] = await db.insert(labResults)
          .values(resultData)
          .returning();
      }
      
      res.json({
        message: id ? "Lab result updated successfully" : "Lab result saved successfully",
        result: savedResult
      });
    } catch (error) {
      console.error("Error saving lab result:", error);
      res.status(500).json({ message: "Failed to save lab result" });
    }
  });

  // Get lab results for a patient
  router.get('/patients/:patientId/lab-results', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;
      
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      const patientResults = await db.select()
        .from(labResults)
        .where(and(
          eq(labResults.patientId, patientId),
          eq(labResults.organizationId, userOrgId)
        ))
        .orderBy(desc(labResults.testDate));
      
      res.json(patientResults);
    } catch (error) {
      console.error('Error fetching patient lab results:', error);
      res.status(500).json({ message: "Failed to fetch lab results" });
    }
  });

  // Review lab result (update status)
  router.put('/lab-results/:id/review', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const resultId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      const { status, notes } = req.body;
      
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }
      
      const [updatedResult] = await db.update(labResults)
        .set({
          status: status || 'reviewed',
          notes: notes || null
        })
        .where(and(
          eq(labResults.id, resultId),
          eq(labResults.organizationId, userOrgId)
        ))
        .returning();
      
      if (!updatedResult) {
        return res.status(404).json({ message: "Lab result not found" });
      }
      
      res.json({
        message: "Lab result reviewed successfully",
        result: updatedResult
      });
    } catch (error) {
      console.error('Error reviewing lab result:', error);
      res.status(500).json({ message: "Failed to review lab result" });
    }
  });

  return router;
}

