// @/ai/flows/create-transaction-flow.ts
'use server';
/**
 * @fileOverview Alur untuk membuat transaksi, membuat entri jurnal, dan memperbarui stok.
 *
 * - createTransaction - Fungsi utama yang menangani proses transaksi.
 * - CreateTransactionInput - Tipe input untuk fungsi createTransaction.
 * - CreateTransactionOutput - Tipe output untuk fungsi createTransaction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/services/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';


const CartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  hpp: z.number().optional().default(0), // Harga Pokok Penjualan per item
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>;
const CreateTransactionInputSchema = z.object({
  items: z.array(CartItemSchema),
  subtotal: z.number(),
  discountAmount: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  paymentMethod: z.string(),
  customerId: z.string(),
  idUMKM: z.string(),
  isPkp: z.boolean().optional().default(false),
  // Account IDs
  salesAccountId: z.string(),
  discountAccountId: z.string().optional(),
  cogsAccountId: z.string(),
  inventoryAccountId: z.string(),
  taxAccountId: z.string().optional(),
  paymentAccountId: z.string(),
});


export type CreateTransactionOutput = z.infer<typeof CreateTransactionOutputSchema>;
const CreateTransactionOutputSchema = z.object({
  success: z.boolean(),
  transactionId: z.string(),
});

// Fungsi wrapper yang akan dipanggil dari aplikasi Next.js
export async function createTransaction(input: CreateTransactionInput): Promise<CreateTransactionOutput> {
  return createTransactionFlow(input);
}

const createTransactionFlow = ai.defineFlow(
  {
    name: 'createTransactionFlow',
    inputSchema: CreateTransactionInputSchema,
    outputSchema: CreateTransactionOutputSchema,
  },
  async (input) => {
    const db = adminDb();
    const batch = db.batch();

    const transactionRef = db.collection('transactions').doc();
    const transactionTimestamp = Timestamp.now();
    
    // 1. Buat Entri Jurnal (`lines`)
    const journalLines = [];
    const totalHpp = input.items.reduce((sum, item) => sum + (item.hpp || 0) * item.quantity, 0);

    // Debit: Akun Pembayaran (Kas/Bank) sejumlah total yang dibayar
    journalLines.push({ accountId: input.paymentAccountId, debit: input.total, credit: 0, description: `Penerimaan Penjualan Kasir via ${input.paymentMethod}` });
    
    // Debit: HPP
    if (totalHpp > 0) {
      journalLines.push({ accountId: input.cogsAccountId, debit: totalHpp, credit: 0, description: 'HPP Penjualan dari Kasir' });
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
    if (totalHpp > 0) {
        journalLines.push({ accountId: input.inventoryAccountId, debit: 0, credit: totalHpp, description: 'Pengurangan Persediaan dari Penjualan Kasir' });
    }

    // 2. Siapkan data transaksi untuk disimpan
    const transactionData = {
      idUMKM: input.idUMKM,
      date: transactionTimestamp,
      description: `Penjualan Kasir - Transaksi #${transactionRef.id.substring(0, 5)}`,
      type: 'Sale',
      status: 'Selesai',
      paymentStatus: 'Berhasil', // Dianggap berhasil karena ini alur backend
      transactionNumber: `KSR-${Date.now()}`,
      amount: input.total,
      paidAmount: input.total,
      subtotal: input.subtotal,
      discountAmount: input.discountAmount,
      taxAmount: input.taxAmount,
      items: input.items.map(({ hpp, ...rest }) => rest), // Hapus HPP dari item yang disimpan
      customerId: input.customerId,
      paymentMethod: input.paymentMethod,
      isPkp: input.isPkp,
      lines: journalLines,
      // Simpan juga ID akun yang digunakan
      paymentAccountId: input.paymentAccountId,
      salesAccountId: input.salesAccountId,
      cogsAccountId: input.cogsAccountId,
      inventoryAccountId: input.inventoryAccountId,
      discountAccountId: input.discountAccountId || null,
      taxAccountId: input.taxAccountId || null,
    };
    
    batch.set(transactionRef, transactionData);

    // 3. Update Stok Produk
    input.items.forEach(item => {
      const productRef = db.collection('products').doc(item.id);
      batch.update(productRef, { stock: FieldValue.increment(-item.quantity) });
    });

    await batch.commit();

    return {
      success: true,
      transactionId: transactionRef.id,
    };
  }
);
