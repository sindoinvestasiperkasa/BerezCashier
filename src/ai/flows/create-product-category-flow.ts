
'use server';
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
    authPolicy: async (auth, input) => {
        if (!auth) {
            throw new Error("Authorization required.");
        }
        const idUMKM = auth.role === 'UMKM' ? auth.uid : auth.idUMKM;
        if (!idUMKM) {
            throw new Error("UMKM ID not found for the user.");
        }
        (input as any).idUMKM = idUMKM;
    }
  },
  async (input) => {
    const db = adminDb();
    const { name, description, ...rest } = input;
    const idUMKM = (rest as any).idUMKM;

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
