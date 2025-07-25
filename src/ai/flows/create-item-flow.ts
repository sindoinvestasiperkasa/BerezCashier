
'use server';
/**
 * @fileOverview Flow untuk membuat item baru, baik produk jadi maupun bahan baku.
 * 
 * - createItem - Fungsi utama untuk membuat item baru di Firestore.
 * - CreateItemInput - Tipe input untuk fungsi createItem.
 * - CreateItemOutput - Tipe output untuk fungsi createItem.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/services/firebase-admin';
import { getAuth } from "firebase-admin/auth";
import { runFlow } from '@genkit-ai/next';

// Skema untuk input flow
const CreateItemInputSchema = z.object({
  itemType: z.enum(['product', 'raw_material']).describe("Tipe item yang akan dibuat."),
  name: z.string().describe("Nama item."),
  productType: z.enum(['Barang', 'Jasa']).optional().describe("Tipe produk (jika itemType adalah 'product')."),
  itemCategory: z.enum(['retail_good', 'manufactured_good', 'service', 'raw_material']).optional().describe("Kategori spesifik dari item."),
  price: z.number().optional().describe("Harga jual (jika itemType adalah 'product')."),
  hpp: z.number().optional().describe("Harga Pokok Penjualan (jika itemType adalah 'product')."),
  initialStock: z.number().optional().describe("Stok awal item."),
  unit: z.string().optional().describe("Satuan untuk bahan baku (e.g., kg, liter, pcs)."),
  // idUMKM akan diambil dari auth token di dalam flow
});
export type CreateItemInput = z.infer<typeof CreateItemInputSchema>;


// Skema untuk output flow
const CreateItemOutputSchema = z.object({
  success: z.boolean(),
  itemId: z.string().optional(),
  message: z.string().optional(),
});
export type CreateItemOutput = z.infer<typeof CreateItemOutputSchema>;

// Fungsi wrapper yang aman dipanggil dari komponen client
export async function createItem(input: CreateItemInput): Promise<CreateItemOutput> {
  // Pass the auth token to the flow securely
  return await runFlow(createItemFlow, input);
}

// Definisi Flow
export const createItemFlow = ai.defineFlow(
  {
    name: 'createItemFlow',
    inputSchema: CreateItemInputSchema,
    outputSchema: CreateItemOutputSchema,
    authPolicy: async (auth, input) => {
        if (!auth) {
            throw new Error("Authorization required.");
        }
        // Asosiasikan item dengan idUMKM pengguna
        const idUMKM = auth.role === 'UMKM' ? auth.uid : auth.idUMKM;
        if (!idUMKM) {
            throw new Error("UMKM ID not found for the user.");
        }
        // Mutate input to include idUMKM
        (input as any).idUMKM = idUMKM;
    }
  },
  async (input) => {
    const db = adminDb();
    const { itemType, name, productType, itemCategory, price, hpp, initialStock, unit, ...rest } = input;
    const idUMKM = (rest as any).idUMKM;

    if (itemType === 'product') {
        const newProductRef = db.collection('products').doc();
        await newProductRef.set({
            idUMKM,
            name,
            productType: productType || 'Barang', // Fallback for safety
            itemCategory: itemCategory,
            price: price || 0,
            hpp: hpp, // Can be undefined
            stock: productType === 'Jasa' ? null : (initialStock || 0),
            createdAt: new Date(),
            updatedAt: new Date(),
            // Default placeholder image
            imageUrls: ['https://placehold.co/300x300.png']
        });
        return { success: true, itemId: newProductRef.id };
    } else if (itemType === 'raw_material') {
        const newRawMaterialRef = db.collection('rawMaterials').doc();
        await newRawMaterialRef.set({
            idUMKM,
            name,
            itemCategory: 'raw_material',
            stock: initialStock || 0,
            unit: unit || 'pcs',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return { success: true, itemId: newRawMaterialRef.id };
    }

    return { success: false, message: "Tipe item tidak valid." };
  }
);
