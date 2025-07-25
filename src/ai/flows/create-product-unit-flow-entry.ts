
'use server';
/**
 * @fileOverview Entry point aman untuk memanggil alur createProductUnit dari komponen React.
 */
import { runFlow } from '@genkit-ai/next';
import { z } from 'zod';
import { createProductUnitFlow, CreateProductUnitInputSchema, CreateProductUnitOutputSchema } from './create-product-unit-flow';

// Re-export tipe agar bisa diimpor dari satu tempat
export type CreateProductUnitInput = z.infer<typeof CreateProductUnitInputSchema>;
export type CreateProductUnitOutput = z.infer<typeof CreateProductUnitOutputSchema>;

// Fungsi wrapper yang aman untuk dipanggil dari komponen client/server Next.js
export async function createProductUnit(input: CreateProductUnitInput): Promise<CreateProductUnitOutput> {
  return await runFlow(createProductUnitFlow, input);
}
