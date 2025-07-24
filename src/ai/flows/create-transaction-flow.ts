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
import { FieldValue } from 'firebase-admin/firestore';


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
  salesAccountId: z.string(),
  discountAccountId: z.string().optional(),
  cogsAccountId: z.string(),
  inventoryAccountId: z.string(),
  taxAccountId: z.string().optional(),
  cashAccountId: z.string(), // Asumsi ada akun default untuk kas/bank
});


export type CreateTransactionOutput = z.infer<typeof CreateTransactionOutputSchema>;
const CreateTransactionOutputSchema = z.object({
  success: z.boolean(),
  transactionId: z.string(),
  journalId: z.string().optional(),
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

    // 1. Simpan data transaksi
    const transactionRef = db.collection('transactions').doc();
    batch.set(transactionRef, {
      idUMKM: input.idUMKM,
      customerId: input.customerId,
      date: new Date(),
      items: input.items.map(({ hpp, ...rest }) => rest), // Hapus HPP dari item yang disimpan
      subtotal: input.subtotal,
      discountAmount: input.discountAmount,
      taxAmount: input.taxAmount,
      total: input.total,
      paymentMethod: input.paymentMethod,
      status: 'Selesai',
      paymentStatus: 'Berhasil',
    });

    // 2. Buat Jurnal Umum
    const journalRef = db.collection('journals').doc();
    const journalEntries = [];
    
    const totalHpp = input.items.reduce((sum, item) => sum + (item.hpp || 0) * item.quantity, 0);

    // Debit: Kas/Bank sejumlah total yang dibayar
    journalEntries.push({ accountId: input.cashAccountId, debit: input.total, credit: 0 });
    // Debit: HPP sejumlah total HPP
    if (totalHpp > 0) {
      journalEntries.push({ accountId: input.cogsAccountId, debit: totalHpp, credit: 0 });
    }
    // Debit: Diskon Penjualan jika ada
    if (input.discountAmount > 0 && input.discountAccountId) {
      journalEntries.push({ accountId: input.discountAccountId, debit: input.discountAmount, credit: 0 });
    }

    // Credit: Pendapatan Penjualan sejumlah subtotal
    journalEntries.push({ accountId: input.salesAccountId, debit: 0, credit: input.subtotal });
     // Credit: PPN Keluaran jika ada
    if (input.taxAmount > 0 && input.taxAccountId) {
      journalEntries.push({ accountId: input.taxAccountId, debit: 0, credit: input.taxAmount });
    }
    // Credit: Persediaan sejumlah total HPP
    if (totalHpp > 0) {
        journalEntries.push({ accountId: input.inventoryAccountId, debit: 0, credit: totalHpp });
    }

    batch.set(journalRef, {
      idUMKM: input.idUMKM,
      transactionId: transactionRef.id,
      date: new Date(),
      description: `Penjualan - Transaksi #${transactionRef.id.substring(0, 5)}`,
      entries: journalEntries
    });

    // 3. Update Stok Produk
    input.items.forEach(item => {
      const productRef = db.collection('products').doc(item.id);
      // Asumsi ada field 'stock' di dokumen produk
      batch.update(productRef, { stock: FieldValue.increment(-item.quantity) });
    });

    await batch.commit();

    return {
      success: true,
      transactionId: transactionRef.id,
      journalId: journalRef.id,
    };
  }
);
