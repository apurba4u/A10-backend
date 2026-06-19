import { z } from "zod";

const genres = [
  "Fiction",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Fantasy",
  "Horror",
  "Thriller",
  "Biography",
  "Technology",
  "Science",
  "History",
  "Self-Help",
  "Business",
  "Uncategorized",
];

export const createEbookSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  fullContent: z.string().default(""),
  genre: z.enum(genres, {
    errorMap: () => ({ message: "Invalid genre" }),
  }),
  price: z.number().min(0, "Price cannot be negative"),
  coverImage: z.string().url("Invalid cover image URL").nullable().optional(),
});

export const updateEbookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  fullContent: z.string().optional(),
  genre: z.enum(genres).optional(),
  price: z.number().min(0).optional(),
  coverImage: z.string().url().nullable().optional(),
  isPublished: z.boolean().optional(),
});
