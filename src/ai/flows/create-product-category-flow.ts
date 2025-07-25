/**
 * @fileOverview Flow untuk membuat kategori produk baru.
 * 
 * - createProductCategoryFlow - Definisi flow Genkit untuk membuat kategori.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/services/firebase-admin';

export const CreateProductCategoryInputSchema = z.object({
  name: z.string().describe("Nama kategori produk."),
  description: z.string().optional().describe("Deskripsi kategori produk."),
});
export type CreateProductCategoryInput = z.infer<typeof CreateProductCategoryInputSchema>;

export const CreateProductCategoryOutputSchema = z.object({
  success: z.boolean(),
  categoryId: z.string().optional(),
  message: z.string().optional(),
});
export type CreateProductCategoryOutput = z.infer<typeof CreateProductCategoryOutputSchema>;

export const createProductCategoryFlow = ai.defineFlow(
  {
    name: 'createProductCategoryFlow',
    inputSchema: CreateProductCategoryInputSchema,
    outputSchema: CreateProductCategoryOutputSchema,
    middleware: async (input, auth) => {
        if (!auth) {
            throw new Error("Authorization required.");
        }
        const idUMKM = auth.role === 'UMKM' ? auth.uid : auth.idUMKM;
        if (!idUMKM) {
            throw new Error("UMKM ID not found for the user.");
        }
        // Add idUMKM to the input object to be used in the handler
        return { ...input, idUMKM };
    }
  },
  async (input) => {
    const db = adminDb();
    // Destructure all properties, including idUMKM, from the modified input
    const { name, description, idUMKM } = input as CreateProductCategoryInput & { idUMKM: string };

    const newCategoryRef = db.collection('productCategories').doc();
    
    await newCategoryRef.set({
        idUMKM,
        name,
        description: description || null,
        createdAt: new Date(),
    });

    return { success: true, categoryId: newCategoryRef.id };
  }
);
