import { db } from "../db";
import { organizations } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Get organization details by ID
 */
export async function getOrganizationDetails(orgId: number) {
  const [org] = await db.select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return org;
}

