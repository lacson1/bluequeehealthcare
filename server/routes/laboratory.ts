import { Router } from "express";
import { authenticateToken, requireAnyRole, requireRole, type AuthRequest } from "../middleware/auth";
import { tenantMiddleware, type TenantRequest } from "../middleware/tenant";
import { storage } from "../storage";
import { insertLabTestSchema, insertLabResultSchema, labTests, labOrders, labOrderItems, labResults, patients, users, organizations } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";
import { AuditLogger } from "../audit";

const router = Router();

/**
 * Laboratory management routes
 * Handles: lab orders, test results, AI analysis, FHIR exports
 */
export function setupLaboratoryRoutes(): Router {

  // === PATIENT LAB RESULTS ===

  // Create lab result for patient
  router.post("/patients/:id/labs", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const labData = insertLabResultSchema.parse({ ...req.body, patientId });
      const labResult = await storage.createLabResult(labData);
      res.json(labResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid lab result data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create lab result" });
      }
    }
  });

  // Get patient lab results
  router.get("/patients/:id/labs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const organizationId = req.user?.organizationId;

      console.log('Lab Results Query Debug:', { patientId, organizationId, userId: req.user?.id });

      if (!organizationId) {
        return res.status(403).json({ message: "Organization access required" });
      }

      // Get completed lab results from lab order items with results
      const labResults = await db
        .select({
          id: labOrderItems.id,
          patientId: labOrders.patientId,
          testName: labTests.name,
          testDate: labOrderItems.completedAt,
          result: labOrderItems.result,
          normalRange: labTests.referenceRange,
          status: labOrderItems.status,
          notes: labOrderItems.remarks,
          organizationId: labOrders.organizationId,
          createdAt: labOrders.createdAt
        })
        .from(labOrderItems)
        .innerJoin(labOrders, eq(labOrderItems.labOrderId, labOrders.id))
        .innerJoin(labTests, eq(labOrderItems.labTestId, labTests.id))
        .where(
          and(
            eq(labOrders.patientId, patientId),
            eq(labOrders.organizationId, organizationId),
            isNotNull(labOrderItems.result) // Only get items with actual results
          )
        )
        .orderBy(desc(labOrderItems.completedAt));

      console.log('Lab Results Found:', labResults.length, labResults);
      res.json(labResults);
    } catch (error) {
      console.error("Error fetching lab results:", error);
      res.status(500).json({ message: "Failed to fetch lab results" });
    }
  });

  // === LAB TESTS MANAGEMENT ===

  // Get lab tests (old endpoint)
  router.get('/lab-tests-old', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const labTestResults = await db.select().from(labTests);
      const convertedResults = labTestResults.map(test => ({
        id: test.id,
        name: test.name,
        category: test.category || 'General',
        referenceRange: test.referenceRange || 'See lab standards',
        units: test.units || '',
        cost: test.cost || 0,
        turnaroundTime: '1-2 days', // Default turnaround time
        description: test.description || ''
      }));
      res.json(convertedResults);
    } catch (error) {
      console.error("Error fetching lab tests:", error);
      res.status(500).json({ message: "Failed to fetch lab tests" });
    }
  });

  // Get lab tests (modern endpoint)
  router.get('/lab-tests', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const tests = await db.select().from(labTests).orderBy(labTests.name);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lab tests" });
    }
  });

  // Create lab test (admin only)
  router.post('/lab-tests', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertLabTestSchema.parse(req.body);

      const [labTest] = await db.insert(labTests)
        .values(validatedData as any)
        .returning();

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logSystemAction("Lab Test Created", {
        labTestId: labTest.id,
        labTestName: labTest.name,
        category: labTest.category
      });

      res.status(201).json(labTest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lab test data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lab test" });
    }
  });

  // Update lab test (admin only)
  router.patch('/lab-tests/:id', authenticateToken, requireAnyRole(['admin', 'lab_manager']), async (req: AuthRequest, res) => {
    try {
      const labTestId = parseInt(req.params.id);
      const updateData = req.body;

      // Remove undefined/empty fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      const [updatedTest] = await db.update(labTests)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(labTests.id, labTestId))
        .returning();

      if (!updatedTest) {
        return res.status(404).json({ message: "Lab test not found" });
      }

      res.json(updatedTest);
    } catch (error) {
      console.error('Error updating lab test:', error);
      res.status(500).json({ message: "Failed to update lab test" });
    }
  });

  // === LAB ORDERS MANAGEMENT ===

  // Create lab order for patient
  router.post('/patients/:id/lab-orders', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      console.log('🔬 Lab order creation request:', {
        patientId: req.params.id,
        body: req.body,
        user: req.user
      });

      const patientId = parseInt(req.params.id);
      const { tests, labTestIds, notes, priority } = req.body;
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      console.log('🔬 Processing lab order:', { patientId, tests, labTestIds, userOrgId });

      // Verify patient exists (organization alignment already handled)
      const [patient] = await db.select().from(patients).where(
        eq(patients.id, patientId)
      ).limit(1);

      if (!patient) {
        console.log('❌ Patient not found:', patientId);
        return res.status(404).json({ message: "Patient not found" });
      }

      console.log('✅ Patient found:', patient);

      // Handle both 'tests' and 'labTestIds' fields for compatibility
      const testIds = tests || labTestIds;

      if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
        console.log('❌ Invalid test IDs:', testIds);
        return res.status(400).json({ message: "Tests array is required" });
      }

      console.log('🧪 Creating lab order with tests:', testIds);

      // Create the lab order with organization context
      const [labOrder] = await db.insert(labOrders)
        .values({
          patientId,
          orderedBy: req.user!.id,
          organizationId: userOrgId,
          status: 'pending'
        } as any)
        .returning();

      // Create lab order items for each test
      const orderItems = testIds.map((testId: number) => ({
        labOrderId: labOrder.id,
        labTestId: testId,
        status: 'pending'
      }));

      await db.insert(labOrderItems).values(orderItems);

      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPatientAction("Lab Order Created", patientId, {
        labOrderId: labOrder.id,
        testCount: testIds.length,
        testIds: testIds,
        notes: notes
      });

      res.status(201).json(labOrder);
    } catch (error) {
      console.error('Lab order creation error:', error);
      res.status(500).json({ message: "Failed to create lab order" });
    }
  });

  // Get pending lab orders
  router.get('/lab-orders/pending', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const pendingOrders = await db.select({
        id: labOrders.id,
        patientId: labOrders.patientId,
        orderedBy: labOrders.orderedBy,
        createdAt: labOrders.createdAt,
        status: labOrders.status,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
        patientDateOfBirth: patients.dateOfBirth,
        orderedByUsername: users.username,
        orderedByRole: users.role
      })
        .from(labOrders)
        .leftJoin(patients, eq(labOrders.patientId, patients.id))
        .leftJoin(users, eq(labOrders.orderedBy, users.id))
        .where(and(
          eq(labOrders.status, 'pending'),
          eq(labOrders.organizationId, userOrgId)
        ))
        .orderBy(labOrders.createdAt);

      // Transform the data to match frontend expectations
      const transformedOrders = pendingOrders.map(order => ({
        id: order.id,
        patientId: order.patientId,
        orderedBy: order.orderedByUsername || `User #${order.orderedBy}`,
        orderedByRole: order.orderedByRole,
        createdAt: order.createdAt,
        status: order.status,
        patient: {
          firstName: order.patientFirstName,
          lastName: order.patientLastName,
          dateOfBirth: order.patientDateOfBirth
        }
      }));

      res.json(transformedOrders);
    } catch (error) {
      console.error("Error fetching pending lab orders:", error);
      res.status(500).json({ message: "Failed to fetch pending lab orders" });
    }
  });

  // Get completed lab orders
  router.get('/lab-orders/completed', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const completedOrders = await db.select({
        id: labOrders.id,
        patientId: labOrders.patientId,
        orderedBy: labOrders.orderedBy,
        createdAt: labOrders.createdAt,
        completedAt: labOrders.completedAt,
        status: labOrders.status,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
        patientDateOfBirth: patients.dateOfBirth,
        orderedByUsername: users.username,
        orderedByRole: users.role
      })
        .from(labOrders)
        .leftJoin(patients, eq(labOrders.patientId, patients.id))
        .leftJoin(users, eq(labOrders.orderedBy, users.id))
        .where(and(
          eq(labOrders.status, 'completed'),
          eq(labOrders.organizationId, userOrgId)
        ))
        .orderBy(desc(labOrders.completedAt));

      // Transform the data to match frontend expectations
      const transformedOrders = completedOrders.map(order => ({
        id: order.id,
        patientId: order.patientId,
        orderedBy: order.orderedByUsername || `User #${order.orderedBy}`,
        orderedByRole: order.orderedByRole,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
        status: order.status,
        patient: {
          firstName: order.patientFirstName,
          lastName: order.patientLastName,
          dateOfBirth: order.patientDateOfBirth
        }
      }));

      res.json(transformedOrders);
    } catch (error) {
      console.error("Error fetching completed lab orders:", error);
      res.status(500).json({ message: "Failed to fetch completed lab orders" });
    }
  });

  // Get enhanced lab orders with patient and test details
  router.get('/lab-orders/enhanced', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.currentOrganizationId || req.user?.organizationId;
      const { status, priority } = req.query;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      let query = db.select({
        id: labOrders.id,
        patientId: labOrders.patientId,
        status: labOrders.status,
        priority: labOrders.priority,
        createdAt: labOrders.createdAt,
        clinicalNotes: labOrders.clinicalNotes,
        diagnosis: labOrders.diagnosis,
        patient: {
          firstName: patients.firstName,
          lastName: patients.lastName,
          dateOfBirth: patients.dateOfBirth,
          phone: patients.phone
        },
        orderedByUser: {
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role
        },
        itemCount: sql<number>`(SELECT COUNT(*) FROM lab_order_items WHERE lab_order_id = ${labOrders.id})`,
        completedItems: sql<number>`(SELECT COUNT(*) FROM lab_order_items WHERE lab_order_id = ${labOrders.id} AND status = 'completed')`,
        totalCost: sql<string>`(SELECT SUM(CAST(cost AS DECIMAL)) FROM lab_order_items loi JOIN lab_tests lt ON loi.lab_test_id = lt.id WHERE loi.lab_order_id = ${labOrders.id})`
      })
        .from(labOrders)
        .leftJoin(patients, eq(labOrders.patientId, patients.id))
        .leftJoin(users, eq(labOrders.orderedBy, users.id));

      const orderConditions: any[] = [eq(labOrders.organizationId, userOrgId)];
      if (status && status !== 'all') {
        orderConditions.push(eq(labOrders.status, status as string));
      }
      if (priority && priority !== 'all') {
        orderConditions.push(eq(labOrders.priority, priority as string));
      }

      if (orderConditions.length > 0) {
        query = (query as any).where(and(...orderConditions));
      }

      const orders = await query.orderBy(desc(labOrders.createdAt));
      return res.json(orders);
    } catch (error) {
      console.error('Error fetching enhanced lab orders:', error);
      return res.status(500).json({ message: "Failed to fetch lab orders" });
    }
  });

  // Get lab orders with items (for detailed view)
  router.get('/lab-orders-with-items', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Get all lab orders for the organization
      const orders = await db.select({
        id: labOrders.id,
        patientId: labOrders.patientId,
        orderedBy: labOrders.orderedBy,
        status: labOrders.status,
        priority: labOrders.priority,
        createdAt: labOrders.createdAt,
        completedAt: labOrders.completedAt,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
        orderedByUsername: users.username
      })
        .from(labOrders)
        .leftJoin(patients, eq(labOrders.patientId, patients.id))
        .leftJoin(users, eq(labOrders.orderedBy, users.id))
        .where(eq(labOrders.organizationId, userOrgId))
        .orderBy(desc(labOrders.createdAt));

      // Get items for each order
      const ordersWithItems = await Promise.all(orders.map(async (order) => {
        const items = await db.select({
          id: labOrderItems.id,
          labOrderId: labOrderItems.labOrderId,
          labTestId: labOrderItems.labTestId,
          result: labOrderItems.result,
          remarks: labOrderItems.remarks,
          status: labOrderItems.status,
          completedBy: labOrderItems.completedBy,
          completedAt: labOrderItems.completedAt,
          testName: labTests.name,
          testCategory: labTests.category,
          referenceRange: labTests.referenceRange,
          units: labTests.units
        })
          .from(labOrderItems)
          .leftJoin(labTests, eq(labOrderItems.labTestId, labTests.id))
          .where(eq(labOrderItems.labOrderId, order.id))
          .orderBy(labTests.name);

        return {
          ...order,
          patient: {
            firstName: order.patientFirstName,
            lastName: order.patientLastName
          },
          orderedBy: order.orderedByUsername || `User #${order.orderedBy}`,
          items
        };
      }));

      res.json(ordersWithItems);
    } catch (error) {
      console.error("Error fetching lab orders with items:", error);
      res.status(500).json({ message: "Failed to fetch lab orders with items" });
    }
  });

  // Get patient lab orders
  router.get('/patients/:id/lab-orders', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const patientId = parseInt(req.params.id);

      const orders = await db.select({
        id: labOrders.id,
        patientId: labOrders.patientId,
        orderedBy: labOrders.orderedBy,
        status: labOrders.status,
        priority: labOrders.priority,
        notes: labOrders.clinicalNotes,
        organizationId: labOrders.organizationId,
        totalCost: labOrders.totalCost,
        specimenCollectedAt: labOrders.specimenCollectedAt,
        specimenCollectedBy: labOrders.specimenCollectedBy,
        reportedAt: labOrders.reportedAt,
        reviewedBy: labOrders.reviewedBy,
        reviewedAt: labOrders.reviewedAt,
        createdAt: labOrders.createdAt,
        completedAt: labOrders.completedAt
      })
        .from(labOrders)
        .where(and(
          eq(labOrders.patientId, patientId),
          eq(labOrders.organizationId, userOrgId)
        ))
        .orderBy(labOrders.createdAt);

      // Set no-cache headers to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json(orders);
    } catch (error) {
      console.error('Error fetching patient lab orders:', error);
      res.status(500).json({ message: "Failed to fetch lab orders" });
    }
  });

  // Get specific lab order details for patient
  router.get('/patients/:patientId/lab-orders/:orderId', authenticateToken, async (req: AuthRequest, res) => {
    console.log('=== LAB ORDER DETAILS ROUTE HIT ===');
    console.log('URL params:', req.params);
    console.log('User org ID:', req.user?.organizationId);

    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        console.log('ERROR: No organization context');
        return res.status(400).json({ message: "Organization context required" });
      }

      const patientId = parseInt(req.params.patientId);
      const orderId = parseInt(req.params.orderId);

      console.log('Looking for lab order:', { patientId, orderId, userOrgId });

      // Get lab order details - using simple select to avoid Drizzle field selection issues
      const labOrderResults = await db.select()
        .from(labOrders)
        .where(and(
          eq(labOrders.id, orderId),
          eq(labOrders.patientId, patientId),
          eq(labOrders.organizationId, userOrgId)
        ));

      console.log('Lab order query results:', labOrderResults);

      if (!labOrderResults || labOrderResults.length === 0) {
        console.log('ERROR: Lab order not found');
        return res.status(404).json({ message: "Lab order not found" });
      }

      const labOrder = labOrderResults[0];
      console.log('Lab order found:', labOrder);

      // Get lab order items - simplified query to avoid Drizzle issues
      const orderItems = await db.select()
        .from(labOrderItems)
        .where(eq(labOrderItems.labOrderId, orderId));

      console.log('Lab order items found:', orderItems.length);

      // Combine order details with items
      const orderWithItems = {
        ...labOrder,
        items: orderItems
      };

      console.log('Sending JSON response:', orderWithItems);

      // Set no-cache headers to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json(orderWithItems);
      console.log('=== RESPONSE SENT ===');
    } catch (error) {
      console.error('ERROR in lab order details route:', error);
      res.status(500).json({ message: "Failed to fetch lab order details" });
    }
  });

  // Get lab order items
  router.get('/lab-orders/:id/items', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const labOrderId = parseInt(req.params.id);

      // Verify lab order belongs to user's organization
      const labOrder = await db.select().from(labOrders).where(
        and(
          eq(labOrders.id, labOrderId),
          eq(labOrders.organizationId, userOrgId)
        )
      ).limit(1);

      if (labOrder.length === 0) {
        return res.status(404).json({ message: "Lab order not found in your organization" });
      }

      const orderItems = await db.select({
        id: labOrderItems.id,
        labOrderId: labOrderItems.labOrderId,
        labTestId: labOrderItems.labTestId,
        result: labOrderItems.result,
        remarks: labOrderItems.remarks,
        status: labOrderItems.status,
        completedBy: labOrderItems.completedBy,
        completedAt: labOrderItems.completedAt,
        testName: labTests.name,
        testCategory: labTests.category,
        referenceRange: labTests.referenceRange,
        units: labTests.units
      })
        .from(labOrderItems)
        .leftJoin(labTests, eq(labOrderItems.labTestId, labTests.id))
        .where(eq(labOrderItems.labOrderId, labOrderId))
        .orderBy(labTests.name);

      // Set no-cache headers to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.json(orderItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lab order items" });
    }
  });

  // === LAB RESULTS MANAGEMENT ===

  // Helper function to determine if a lab result is normal
  function isResultNormal(result: string, normalRange: string): boolean {
    try {
      // Simple logic for common ranges like "3.5-5.0" or "< 10"
      if (normalRange.includes('-')) {
        const [min, max] = normalRange.split('-').map(s => parseFloat(s.trim()));
        const value = parseFloat(result);
        return !isNaN(value) && !isNaN(min) && !isNaN(max) && value >= min && value <= max;
      }
      if (normalRange.startsWith('<')) {
        const max = parseFloat(normalRange.substring(1).trim());
        const value = parseFloat(result);
        return !isNaN(value) && !isNaN(max) && value < max;
      }
      if (normalRange.startsWith('>')) {
        const min = parseFloat(normalRange.substring(1).trim());
        const value = parseFloat(result);
        return !isNaN(value) && !isNaN(min) && value > min;
      }
      // Default to normal if we can't parse
      return true;
    } catch {
      return true;
    }
  }

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

  // Bulk save lab results
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

      // Process bulk save
      const savedResults = [];
      for (const result of results) {
        try {
          const savedResult = await storage.createLabResult({
            ...result,
            organizationId: userOrgId
          });
          savedResults.push(savedResult);
        } catch (error) {
          console.error(`Failed to save result ${result.id}:`, error);
        }
      }

      res.json({
        success: true,
        saved: savedResults.length,
        total: results.length,
        results: savedResults
      });
    } catch (error) {
      console.error("Error bulk saving lab results:", error);
      res.status(500).json({ message: "Failed to bulk save lab results" });
    }
  });

  // Update lab order item
  router.patch('/lab-order-items/:id', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const updateData = req.body;

      // Remove undefined/empty fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      // Add completion timestamp if result is being set
      if (updateData.result && !updateData.completedAt) {
        updateData.completedAt = new Date();
        updateData.completedBy = req.user?.id;
      }

      const [updatedItem] = await db.update(labOrderItems)
        .set(updateData)
        .where(eq(labOrderItems.id, itemId))
        .returning();

      if (!updatedItem) {
        return res.status(404).json({ message: "Lab order item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating lab order item:', error);
      res.status(500).json({ message: "Failed to update lab order item" });
    }
  });

  // Search lab tests
  router.get("/lab-tests/search", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      const searchTerm = (q as string) || "";

      if (!searchTerm || searchTerm.length < 2) {
        return res.json([]);
      }

      const tests = await db.select()
        .from(labTests)
        .where(sql`${labTests.name} ILIKE ${'%' + searchTerm + '%'}`)
        .limit(10)
        .orderBy(labTests.name);

      res.json(tests);
    } catch (error) {
      console.error("Error searching lab tests:", error);
      res.status(500).json({ message: "Failed to search lab tests" });
    }
  });

  return router;
}