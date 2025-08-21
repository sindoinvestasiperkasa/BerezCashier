// @/ai/flows/record-purchase-flow.ts

/**
 * @fileOverview Flow untuk mencatat pembelian (penambahan stok) untuk produk retail.
 *
 * - recordPurchaseFlow - Definisi flow Genkit untuk proses pencatatan pembelian.
 * - RecordPurchaseInput - Tipe input untuk fungsi recordPurchaseFlow.
 * - RecordPurchaseOutput - Tipe output untuk fungsi recordPurchaseFlow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/services/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';


export const RecordPurchaseInputSchema = z.object({
  productId: z.string().describe("ID dari produk yang dibeli."),
  quantity: z.number().int().positive().describe("Jumlah produk yang ditambahkan."),
  hpp: z.number().positive().describe("Harga Pokok Penjualan (harga beli) per item."),
  idUMKM: z.string().describe("ID dari UMKM yang melakukan pembelian."),
  branchId: z.string().optional().describe("ID cabang tempat pembelian dicatat."),
  warehouseId: z.string().describe("ID gudang tempat stok disimpan."),
  expirationDate: z.string().optional().describe("Tanggal kedaluwarsa produk jika ada (format ISO string).")
});
export type RecordPurchaseInput = z.infer<typeof RecordPurchaseInputSchema>;


export const RecordPurchaseOutputSchema = z.object({
  success: z.boolean(),
  stockLotId: z.string().optional(),
});
export type RecordPurchaseOutput = z.infer<typeof RecordPurchaseOutputSchema>;

export const recordPurchaseFlow = ai.defineFlow(
  {
    name: 'recordPurchaseFlow',
    inputSchema: RecordPurchaseInputSchema,
    outputSchema: RecordPurchaseOutputSchema,
  },
  async (input) => {
    const db = adminDb();
    const { productId, quantity, hpp, idUMKM, warehouseId, branchId, expirationDate } = input;

    try {
      // Menjalankan operasi dalam transaksi untuk memastikan atomicity
      const stockLotRef = await db.runTransaction(async (transaction) => {
        const productRef = db.collection('products').doc(productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error(`Produk dengan ID ${productId} tidak ditemukan.`);
        }

        // Membuat dokumen baru di koleksi 'stockLots'
        const newStockLotRef = db.collection('stockLots').doc();
        const now = Timestamp.now();

        const newStockLotData = {
          productId: productId,
          productName: productDoc.data()?.name || 'Unknown Product',
          idUMKM: idUMKM,
          branchId: branchId || null,
          warehouseId: warehouseId,
          initialQuantity: quantity,
          remainingQuantity: quantity,
          purchasePrice: hpp,
          purchaseDate: now,
          createdAt: now,
          expirationDate: expirationDate ? Timestamp.fromDate(new Date(expirationDate)) : null
        };
        
        // Menulis lot stok baru dalam transaksi
        transaction.set(newStockLotRef, newStockLotData);
        
        // Tidak lagi memperbarui stok pada dokumen produk secara langsung.
        // Stok akan dihitung secara dinamis dari 'stockLots' di sisi client.

        return newStockLotRef;
      });

      return {
        success: true,
        stockLotId: stockLotRef.id,
      };

    } catch (error: any) {
      console.error("Error in recordPurchaseFlow: ", error);
      // Mengembalikan pesan error yang lebih informatif
      throw new Error(`Gagal mencatat pembelian: ${error.message}`);
    }
  }
);
