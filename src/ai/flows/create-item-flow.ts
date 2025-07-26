
/**
 * @fileOverview Flow untuk membuat item baru, baik produk jadi maupun bahan baku.
 * 
 * - createItemFlow - Definisi flow Genkit untuk membuat item baru di Firestore.
 * - CreateItemInput - Tipe input untuk fungsi createItemFlow.
 * - CreateItemOutput - Tipe output untuk fungsi createItemFlow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/services/firebase-admin';

// Skema untuk input flow, disesuaikan dengan struktur di Firestore
export const CreateItemInputSchema = z.object({
  name: z.string().describe("Nama item."),
  description: z.string().optional().describe("Deskripsi item."),
  itemCategory: z.enum(['retail_good', 'manufactured_good', 'service', 'raw_material']).describe("Kategori spesifik dari item."),
  productType: z.enum(['Barang', 'Jasa']).optional().describe("Tipe produk (jika itemCategory adalah 'product')."),
  categoryId: z.string().optional().describe("ID dari kategori produk."),
  productCode: z.string().optional().describe("Kode unik untuk produk."),
  price: z.number().optional().describe("Harga jual."),
  purchasePrice: z.number().optional().describe("Harga beli (HPP) untuk barang retail."),
  initialStock: z.number().optional().describe("Stok awal item."),
  lowStockThreshold: z.number().optional().describe("Ambang batas untuk notifikasi stok rendah."),
  unitId: z.string().optional().describe("ID dari satuan untuk item."),
  supplierId: z.string().optional().describe("ID dari pemasok item."),
  imageUrls: z.array(z.string()).optional().describe("URL gambar item."),
  // idUMKM akan diambil dari auth token di dalam flow
});
export type CreateItemInput = z.infer<typeof CreateItemInputSchema>;


// Skema untuk output flow
export const CreateItemOutputSchema = z.object({
  success: z.boolean(),
  itemId: z.string().optional(),
  message: z.string().optional(),
});
export type CreateItemOutput = z.infer<typeof CreateItemOutputSchema>;

// Definisi Flow
export const createItemFlow = ai.defineFlow(
  {
    name: 'createItemFlow',
    inputSchema: CreateItemInputSchema,
    outputSchema: CreateItemOutputSchema,
    middleware: async (input, auth) => {
        if (!auth) {
            throw new Error("Authorization required.");
        }
        const idUMKM = auth.role === 'UMKM' ? auth.uid : auth.idUMKM;
        if (!idUMKM) {
            throw new Error("UMKM ID not found for the user.");
        }
        // Gabungkan input asli dengan idUMKM yang didapat dari auth
        return { ...input, idUMKM };
    }
  },
  async (payload) => {
    const db = adminDb();
    const { 
        name, description, itemCategory, productType, categoryId, productCode,
        price, purchasePrice, initialStock, lowStockThreshold, unitId, supplierId, imageUrls,
        idUMKM,
    } = payload;

    const isProduct = itemCategory === 'retail_good' || itemCategory === 'manufactured_good' || itemCategory === 'service';

    if (isProduct) {
        const newProductRef = db.collection('products').doc();
        await newProductRef.set({
            idUMKM,
            name,
            description: description || "",
            productType: productType,
            productCode: productCode || null,
            itemCategory: itemCategory,
            categoryId: categoryId || null,
            unitId: unitId || null,
            supplierId: supplierId || null,
            price: price || 0,
            purchasePrice: purchasePrice || 0,
            stock: productType === 'Jasa' ? null : (initialStock || 0),
            lowStockThreshold: lowStockThreshold || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : ['https://placehold.co/300x300.png']
        });
        return { success: true, itemId: newProductRef.id };
    } else if (itemCategory === 'raw_material') {
        const newRawMaterialRef = db.collection('rawMaterials').doc();
        await newRawMaterialRef.set({
            idUMKM,
            name,
            description: description || "",
            itemCategory: 'raw_material',
            categoryId: categoryId || null,
            unitId: unitId || null,
            supplierId: supplierId || null,
            stock: initialStock || 0,
            lowStockThreshold: lowStockThreshold || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : ['https://placehold.co/300x300.png'],
        });
        return { success: true, itemId: newRawMaterialRef.id };
    }

    return { success: false, message: "Tipe item tidak valid." };
  }
);
