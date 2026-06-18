import { z } from "zod";

export const createEbookSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  cover: z.string().nullable().optional(),
  file: z.string().nullable().optional(),
  price: z.number().min(0).default(0),
  tags: z.array(z.string()).default([]),
  category: z.string().default("Uncategorized"),
});

export const updateEbookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  cover: z.string().nullable().optional(),
  file: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});
