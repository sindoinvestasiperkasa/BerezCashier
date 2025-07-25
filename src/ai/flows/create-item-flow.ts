
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
  name: z.string().describe("Nama item."),
  description: z.string().optional().describe("Deskripsi item."),
  itemCategory: z.enum(['retail_good', 'manufactured_good', 'service', 'raw_material']).describe("Kategori spesifik dari item."),
  productType: z.enum(['Barang', 'Jasa']).optional().describe("Tipe produk (jika itemCategory adalah 'product')."),
  categoryId: z.string().optional().describe("ID dari kategori produk."),
  price: z.number().optional().describe("Harga jual."),
  hpp: z.number().optional().describe("Harga Pokok Penjualan (HPP) untuk barang retail."),
  initialStock: z.number().optional().describe("Stok awal item."),
  lowStockThreshold: z.number().optional().describe("Ambang batas untuk notifikasi stok rendah."),
  unit: z.string().optional().describe("Satuan untuk item (e.g., kg, liter, pcs, box)."),
  imageUrl: z.string().optional().describe("URL gambar item."),
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
    const { 
        name, description, itemCategory, productType, categoryId, 
        price, hpp, initialStock, lowStockThreshold, unit, imageUrl,
        ...rest 
    } = input;
    const idUMKM = (rest as any).idUMKM;

    const isProduct = itemCategory === 'retail_good' || itemCategory === 'manufactured_good' || itemCategory === 'service';

    if (isProduct) {
        const newProductRef = db.collection('products').doc();
        await newProductRef.set({
            idUMKM,
            name,
            description: description || null,
            productType: productType,
            itemCategory: itemCategory,
            categoryId: categoryId || null,
            price: price || 0,
            hpp: hpp, // Can be undefined for services or manufactured goods
            stock: productType === 'Jasa' ? null : (initialStock || 0),
            lowStockThreshold: lowStockThreshold || null,
            unit: unit || 'pcs',
            createdAt: new Date(),
            updatedAt: new Date(),
            imageUrls: [imageUrl || 'https://placehold.co/300x300.png']
        });
        return { success: true, itemId: newProductRef.id };
    } else if (itemCategory === 'raw_material') {
        const newRawMaterialRef = db.collection('rawMaterials').doc();
        await newRawMaterialRef.set({
            idUMKM,
            name,
            description: description || null,
            itemCategory: 'raw_material',
            stock: initialStock || 0,
            lowStockThreshold: lowStockThreshold || null,
            unit: unit || 'pcs',
            createdAt: new Date(),
            updatedAt: new Date(),
            imageUrl: imageUrl || 'https://placehold.co/300x300.png',
        });
        return { success: true, itemId: newRawMaterialRef.id };
    }

    return { success: false, message: "Tipe item tidak valid." };
  }
);
