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

const AttributeValueSchema = z.object({
  attributeId: z.string(),
  attributeName: z.string(),
  value: z.any(),
});

const CartItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productType: z.enum(['Barang', 'Jasa']).optional(),
  quantity: z.number(),
  unitPrice: z.number(),
  cogs: z.number().default(0),
  attributeValues: z.array(AttributeValueSchema).optional(),
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
  customerName: z.string(),
  idUMKM: z.string(),
  branchId: z.string().optional(),
  warehouseId: z.string().optional(),
  isPkp: z.boolean().optional().default(false),
  // Account IDs
  paymentAccountId: z.string(),
  salesAccountId: z.string(),
  discountAccountId: z.string().optional(),
  cogsAccountId: z.string(),
  inventoryAccountId: z.string(),
  taxAccountId: z.string().optional(),
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
    const totalCogs = input.items.reduce((sum, item) => sum + (item.cogs || 0), 0);

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

    // 2. Siapkan data transaksi untuk disimpan
    const transactionData = {
      idUMKM: input.idUMKM,
      branchId: input.branchId || null,
      warehouseId: input.warehouseId || null,
      date: transactionTimestamp,
      description: `Penjualan Kasir - Transaksi #${transactionRef.id.substring(0, 5)}`,
      type: 'Sale',
      status: 'Lunas',
      paymentStatus: 'Berhasil', // Dianggap berhasil karena ini alur backend
      transactionNumber: `KSR-${Date.now()}`,
      amount: input.total,
      paidAmount: input.total,
      subtotal: input.subtotal,
      discountAmount: input.discountAmount,
      taxAmount: input.taxAmount,
      items: input.items, // Simpan semua data item, termasuk cogs dan attributes
      customerId: input.customerId,
      customerName: input.customerName,
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
      if (item.productType === 'Barang') { // Hanya update stok untuk barang
        const productRef = db.collection('products').doc(item.productId);
        batch.update(productRef, { stock: FieldValue.increment(-item.quantity) });
      }
    });

    await batch.commit();

    return {
      success: true,
      transactionId: transactionRef.id,
    };
  }
);
