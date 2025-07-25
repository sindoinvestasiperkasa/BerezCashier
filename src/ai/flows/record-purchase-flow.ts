// @/ai/flows/record-purchase-flow.ts
'use server';
/**
 * @fileOverview Flow untuk mencatat pembelian (penambahan stok) untuk produk retail.
 *
 * - recordPurchase - Fungsi utama untuk menambah stok dan memperbarui HPP.
 * - RecordPurchaseInput - Tipe input untuk fungsi recordPurchase.
 * - RecordPurchaseOutput - Tipe output untuk fungsi recordPurchase.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/services/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';


export type RecordPurchaseInput = z.infer<typeof RecordPurchaseInputSchema>;
const RecordPurchaseInputSchema = z.object({
  productId: z.string().describe("ID dari produk yang dibeli."),
  quantity: z.number().int().positive().describe("Jumlah produk yang ditambahkan."),
  hpp: z.number().positive().describe("Harga Pokok Penjualan (harga beli) per item."),
  branchId: z.string().optional().describe("ID cabang tempat pembelian dicatat."),
  warehouseId: z.string().optional().describe("ID gudang tempat stok disimpan."),
});


export type RecordPurchaseOutput = z.infer<typeof RecordPurchaseOutputSchema>;
const RecordPurchaseOutputSchema = z.object({
  success: z.boolean(),
  updatedStock: z.number(),
});

// Fungsi wrapper yang akan dipanggil dari aplikasi Next.js
export async function recordPurchase(input: RecordPurchaseInput): Promise<RecordPurchaseOutput> {
  return recordPurchaseFlow(input);
}

const recordPurchaseFlow = ai.defineFlow(
  {
    name: 'recordPurchaseFlow',
    inputSchema: RecordPurchaseInputSchema,
    outputSchema: RecordPurchaseOutputSchema,
  },
  async (input) => {
    const db = adminDb();
    const productRef = db.collection('products').doc(input.productId);

    let finalStock = 0;

    await db.runTransaction(async (transaction) => {
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists) {
        throw new Error(`Produk dengan ID ${input.productId} tidak ditemukan.`);
      }

      const currentStock = productDoc.data()?.stock || 0;
      const newStock = currentStock + input.quantity;

      transaction.update(productRef, {
        stock: newStock,
        hpp: input.hpp
      });

      finalStock = newStock;
    });

    // TODO: Nantinya, buat entri jurnal untuk mencatat pembelian ini.
    // Ini akan menggunakan branchId dan warehouseId yang sudah kita teruskan.
    // Debit: Persediaan Barang Dagang
    // Kredit: Kas/Bank atau Utang Usaha

    return {
      success: true,
      updatedStock: finalStock,
    };
  }
);
