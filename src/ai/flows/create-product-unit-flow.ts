'use server';
/**
 * @fileOverview Flow untuk membuat satuan unit produk baru.
 * 
 * - createProductUnit - Fungsi untuk membuat unit produk.
 * - CreateProductUnitInput - Tipe input.
 * - CreateProductUnitOutput - Tipe output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/services/firebase-admin';
import { runFlow } from '@genkit-ai/next';

const CreateProductUnitInputSchema = z.object({
  name: z.string().describe("Nama lengkap unit (e.g., Kilogram)."),
  symbol: z.string().describe("Simbol atau singkatan unit (e.g., kg)."),
});
export type CreateProductUnitInput = z.infer<typeof CreateProductUnitInputSchema>;

const CreateProductUnitOutputSchema = z.object({
  success: z.boolean(),
  unitId: z.string().optional(),
  unitSymbol: z.string().optional(),
  message: z.string().optional(),
});
export type CreateProductUnitOutput = z.infer<typeof CreateProductUnitOutputSchema>;


export async function createProductUnit(input: CreateProductUnitInput): Promise<CreateProductUnitOutput> {
  return await runFlow(createProductUnitFlow, input);
}

const createProductUnitFlow = ai.defineFlow(
  {
    name: 'createProductUnitFlow',
    inputSchema: CreateProductUnitInputSchema,
    outputSchema: CreateProductUnitOutputSchema,
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
    const { name, symbol, ...rest } = input;
    const idUMKM = (rest as any).idUMKM;

    const newUnitRef = db.collection('productUnits').doc();
    
    await newUnitRef.set({
        idUMKM,
        name,
        symbol,
        createdAt: new Date(),
    });

    return { success: true, unitId: newUnitRef.id, unitSymbol: symbol };
  }
);
