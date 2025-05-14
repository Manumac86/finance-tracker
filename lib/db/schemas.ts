import { z } from "zod";
import { ObjectId } from "mongodb";

/**
 * Helper function to convert string to ObjectId
 * Validates if a string can be converted to a valid MongoDB ObjectId
 */
const objectIdSchema = z.string().refine(
  (id) => {
    try {
      new ObjectId(id);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: "Invalid ObjectId format",
  }
);

/**
 * Category schema definition
 * Represents a financial category with an ID, name, description, and icon
 */
export const categorySchema = z.object({
  _id: objectIdSchema.optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string(),
});

/**
 * Type definition for a financial category
 * Represents the structure of a category object
 */
export type Category = z.infer<typeof categorySchema>;

/**
 * Transaction schema definition
 * Represents a financial transaction with an ID, amount, date, description, category, and user ID
 */
export const transactionSchema = z.object({
  _id: objectIdSchema.optional(),
  amount: z.number().min(0),
  name: z.string().min(1),
  date: z.string().datetime(),
  description: z.string().min(1),
  category: categorySchema,
  userId: objectIdSchema.optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Type definition for a financial transaction
 * Represents the structure of a transaction object
 */
export type Transaction = z.infer<typeof transactionSchema>;
