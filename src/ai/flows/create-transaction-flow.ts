
// @/ai/flows/create-transaction-flow.ts
'use server';
/**
 * @fileOverview Alur untuk membuat transaksi, membuat entri jurnal, dan memperbarui stok.
 *
 * - createTransactionFlow - Definisi flow Genkit untuk proses transaksi.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/services/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const AttributeValueSchema = z.object({
  attributeId: z.string(),
  attributeName: z.string(),
  value: z.any(),
});

const CartItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productSubType: z.enum(['Produk Retail', 'Produk Produksi', 'Jasa (Layanan)']).optional(),
  quantity: z.number(),
  unitPrice: z.number(),
  cogs: z.number().default(0),
  attributeValues: z.array(AttributeValueSchema).optional(),
});

const CreateTransactionInputSchema = z.object({
  items: z.array(CartItemSchema),
  subtotal: z.number(),
  discountAmount: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  paymentMethod: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  idUMKM: z.string(),
  branchId: z.string().optional(),
  warehouseId: z.string().optional(),
  isPkp: z.boolean().optional().default(false),
  serviceFee: z.number().optional().default(0),
  // Account IDs
  paymentAccountId: z.string(),
  salesAccountId: z.string(),
  discountAccountId: z.string().optional(),
  cogsAccountId: z.string(),
  inventoryAccountId: z.string(),
  taxAccountId: z.string().optional(),
});


const CreateTransactionOutputSchema = z.object({
  success: z.boolean(),
  transactionId: z.string(),
});

export const createTransactionFlow = ai.defineFlow(
  {
    name: 'createTransactionFlow',
    inputSchema: CreateTransactionInputSchema,
    outputSchema: CreateTransactionOutputSchema,
  },
  async (input) => {
    const db = adminDb();
    
    // Gunakan transaksi Firestore untuk memastikan semua operasi berhasil atau gagal bersamaan
    return await db.runTransaction(async (transaction) => {
        const transactionRef = db.collection('transactions').doc();
        const transactionTimestamp = Timestamp.now();
        
        // --- START READ PHASE ---

        // 1. Baca semua stockLot yang relevan terlebih dahulu.
        const productStockLotReads = input.items
            .filter(item => item.productSubType !== 'Jasa (Layanan)')
            .map(item => {
                const stockLotsQuery = db.collection('stockLots')
                    .where('productId', '==', item.productId)
                    .where('warehouseId', '==', input.warehouseId)
                    .orderBy('createdAt', 'asc');
                return transaction.get(stockLotsQuery).then(snapshot => ({
                    item,
                    // Filter for remaining quantity in code instead of in the query
                    snapshotDocs: snapshot.docs.filter(doc => doc.data().remainingQuantity > 0),
                }));
            });

        const stockLotResults = await Promise.all(productStockLotReads);

        // 2. Validasi stok yang tersedia berdasarkan hasil baca.
        for (const { item, snapshotDocs } of stockLotResults) {
            let totalStockAvailable = 0;
            snapshotDocs.forEach(doc => {
                totalStockAvailable += doc.data().remainingQuantity || 0;
            });

            if (totalStockAvailable < item.quantity) {
                throw new Error(`Stok tidak cukup untuk produk ${item.productName}. Tersedia: ${totalStockAvailable}, Dibutuhkan: ${item.quantity}.`);
            }
        }
        
        // 3. Baca akun biaya layanan jika diperlukan
        let serviceFeeAccountId: string | null = null;
        if (input.serviceFee && input.serviceFee > 0) {
            const serviceFeeAccountName = 'Utang Biaya Layanan Berez';
            const allAccountsQuery = await db.collection('accounts')
                .where('idUMKM', '==', input.idUMKM)
                .get();

            const serviceFeeAccountDoc = allAccountsQuery.docs.find(doc => doc.data().name === serviceFeeAccountName);

            if (serviceFeeAccountDoc) {
                serviceFeeAccountId = serviceFeeAccountDoc.id;
            } else {
                 console.warn(`Akun '${serviceFeeAccountName}' tidak ditemukan untuk UMKM ${input.idUMKM}. Jurnal mungkin tidak seimbang.`);
            }
        }

        // --- END READ PHASE / START WRITE PHASE ---
        
        // 4. Buat Entri Jurnal (`lines`)
        const journalLines = [];
        const totalCogs = input.items.reduce((sum, item) => sum + ((item.cogs || 0) * item.quantity), 0);

        // Debit: Akun Pembayaran (Kas/Bank) sejumlah total yang dibayar
        journalLines.push({ accountId: input.paymentAccountId, debit: input.total, credit: 0, description: `Penerimaan Penjualan Kasir via ${input.paymentMethod}` });
        
        // Debit: HPP
        if (totalCogs > 0) {
          journalLines.push({ accountId: input.cogsAccountId, debit: totalCogs, credit: 0, description: 'HPP Penjualan dari Kasir' });
        }
        
        // Debit: Diskon Penjualan (jika ada)
        if (input.discountAmount > 0 && input.discountAccountId) {
          journalLines.push({ accountId: input.discountAccountId, debit: input.discountAmount, credit: 0, description: 'Potongan Penjualan Kasir' });
        }

        // Credit: Pendapatan Penjualan sejumlah subtotal
        journalLines.push({ accountId: input.salesAccountId, debit: 0, credit: input.subtotal, description: 'Pendapatan Penjualan dari Kasir' });
        
        // Credit: PPN Keluaran (jika ada)
        if (input.taxAmount > 0 && input.taxAccountId) {
          journalLines.push({ accountId: input.taxAccountId, debit: 0, credit: input.taxAmount, description: 'PPN Keluaran dari Penjualan Kasir' });
        }
        
        // Credit: Persediaan
        if (totalCogs > 0) {
            journalLines.push({ accountId: input.inventoryAccountId, debit: 0, credit: totalCogs, description: 'Pengurangan Persediaan dari Penjualan Kasir' });
        }
        
        // Credit: Utang Biaya Layanan (jika ada)
        if (serviceFeeAccountId && input.serviceFee > 0) {
            journalLines.push({ accountId: serviceFeeAccountId, debit: 0, credit: input.serviceFee, description: 'Biaya layanan aplikasi' });
        }


        // 5. Siapkan data transaksi untuk disimpan
        const transactionData = {
          idUMKM: input.idUMKM,
          branchId: input.branchId || null,
          warehouseId: input.warehouseId || null,
          date: transactionTimestamp,
          description: `Penjualan Kasir - Transaksi #${transactionRef.id.substring(0, 5)}`,
          type: 'Sale',
          status: 'Lunas',
          paymentStatus: 'Berhasil', 
          transactionNumber: `KSR-${Date.now()}`,
          amount: input.total,
          paidAmount: input.total,
          subtotal: input.subtotal,
          discountAmount: input.discountAmount,
          taxAmount: input.taxAmount,
          serviceFee: input.serviceFee || 0,
          items: input.items,
          customerId: input.customerId,
          customerName: input.customerName,
          paymentMethod: input.paymentMethod,
          isPkp: input.isPkp,
          lines: journalLines,
          paymentAccountId: input.paymentAccountId,
          salesAccountId: input.salesAccountId,
          cogsAccountId: input.cogsAccountId,
          inventoryAccountId: input.inventoryAccountId,
          discountAccountId: input.discountAccountId || null,
          taxAccountId: input.taxAccountId || null,
        };
        
        // 6. Tulis data transaksi
        transaction.set(transactionRef, transactionData);

        // 7. Update Stok Produk menggunakan FIFO dari hasil baca sebelumnya
        for (const { item, snapshotDocs } of stockLotResults) {
            let quantityToDeduct = item.quantity;
            for (const doc of snapshotDocs) {
                if (quantityToDeduct <= 0) break;

                const lot = doc.data();
                const lotRef = doc.ref;
                const quantityInLot = lot.remainingQuantity;

                if (quantityInLot >= quantityToDeduct) {
                    transaction.update(lotRef, { remainingQuantity: FieldValue.increment(-quantityToDeduct) });
                    quantityToDeduct = 0;
                } else {
                    transaction.update(lotRef, { remainingQuantity: 0 });
                    quantityToDeduct -= quantityInLot;
                }
            }
        }
        
        return {
          success: true,
          transactionId: transactionRef.id,
        };
    });
  }
);
