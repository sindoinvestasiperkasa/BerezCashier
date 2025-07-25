'use server';
/**
 * @fileOverview Entry point aman untuk memanggil alur createTransaction dari komponen React.
 */
import { z } from 'zod';
import { createTransactionFlow } from './create-transaction-flow';

// Re-export tipe agar bisa diimpor dari satu tempat
export type CreateTransactionInput = z.infer<typeof createTransactionFlow.inputSchema>;
export type CreateTransactionOutput = z.infer<typeof createTransactionFlow.outputSchema>;


// Fungsi wrapper yang aman untuk dipanggil dari komponen client/server Next.js
export async function createTransaction(input: CreateTransactionInput): Promise<CreateTransactionOutput> {
  // Panggil flow secara langsung, bukan melalui runFlow, untuk menghindari masalah webpack
  return await createTransactionFlow(input);
}
