import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50).transform((v) => v.toUpperCase().trim()),
  description: z.string().max(500).optional().default(""),
  discountPercent: z.number().min(1).max(100),
  expiresAt: z.string().datetime().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  minPurchaseAmount: z.number().min(0).optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  purchaseAmount: z.number().min(0),
});
