import { db } from "../db";
import { medicines } from "@shared/schema";
import { eq, and, lte, ilike, sql } from "drizzle-orm";
import { insertMedicineSchema } from "@shared/schema";
import type { InsertMedicine } from "@shared/schema";

/**
 * MedicineService - Business logic for medicine/inventory operations
 */
export class MedicineService {
  /**
   * Create a new medicine
   */
  static async createMedicine(medicineData: InsertMedicine) {
    const validatedData = insertMedicineSchema.parse(medicineData);
    const [newMedicine] = await db.insert(medicines).values(validatedData).returning();
    return newMedicine;
  }

  /**
   * Get medicine by ID
   */
  static async getMedicineById(medicineId: number, organizationId?: number) {
    let whereConditions = [eq(medicines.id, medicineId)];
    
    if (organizationId) {
      whereConditions.push(eq(medicines.organizationId, organizationId));
    }
    
    const [medicine] = await db.select()
      .from(medicines)
      .where(and(...whereConditions))
      .limit(1);
    
    return medicine || null;
  }

  /**
   * Get all medicines for an organization
   */
  static async getMedicines(organizationId?: number) {
    let query = db.select().from(medicines);
    
    if (organizationId) {
      query = query.where(eq(medicines.organizationId, organizationId));
    }
    
    return await query.orderBy(medicines.name);
  }

  /**
   * Update medicine
   */
  static async updateMedicine(medicineId: number, updateData: Partial<InsertMedicine>, organizationId?: number) {
    let whereConditions = [eq(medicines.id, medicineId)];
    
    if (organizationId) {
      whereConditions.push(eq(medicines.organizationId, organizationId));
    }
    
    const [updatedMedicine] = await db.update(medicines)
      .set(updateData)
      .where(and(...whereConditions))
      .returning();
    
    return updatedMedicine || null;
  }

  /**
   * Update medicine quantity
   */
  static async updateQuantity(medicineId: number, quantity: number, organizationId?: number) {
    let whereConditions = [eq(medicines.id, medicineId)];
    
    if (organizationId) {
      whereConditions.push(eq(medicines.organizationId, organizationId));
    }
    
    const [updatedMedicine] = await db.update(medicines)
      .set({ quantity })
      .where(and(...whereConditions))
      .returning();
    
    return updatedMedicine || null;
  }

  /**
   * Get low stock medicines
   */
  static async getLowStockMedicines(organizationId: number) {
    return await db.select()
      .from(medicines)
      .where(
        and(
          eq(medicines.organizationId, organizationId),
          lte(medicines.quantity, sql`${medicines.lowStockThreshold}`)
        )
      )
      .orderBy(medicines.quantity);
  }

  /**
   * Search medicines by name
   */
  static async searchMedicines(searchTerm: string, organizationId?: number, limit = 20) {
    let whereConditions: any[] = [];
    
    if (organizationId) {
      whereConditions.push(eq(medicines.organizationId, organizationId));
    }
    
    if (searchTerm) {
      whereConditions.push(ilike(medicines.name, `%${searchTerm}%`));
    }
    
    return await db.select()
      .from(medicines)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(limit)
      .orderBy(medicines.name);
  }

  /**
   * Get medicine statistics
   */
  static async getMedicineStatistics(organizationId: number) {
    const allMedicines = await this.getMedicines(organizationId);
    const lowStockMedicines = await this.getLowStockMedicines(organizationId);
    
    const totalMedicines = allMedicines.length;
    const outOfStock = allMedicines.filter(m => m.quantity === 0).length;
    const lowStock = lowStockMedicines.length;
    const totalValue = allMedicines.reduce((sum, m) => {
      const cost = Number(m.cost) || 0;
      return sum + (cost * m.quantity);
    }, 0);
    
    return {
      totalMedicines,
      outOfStock,
      lowStock,
      totalValue,
      averageStockLevel: totalMedicines > 0 
        ? allMedicines.reduce((sum, m) => sum + m.quantity, 0) / totalMedicines 
        : 0
    };
  }
}

