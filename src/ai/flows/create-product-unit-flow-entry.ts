
'use server';
/**
 * @fileOverview Entry point aman untuk memanggil alur createProductUnit dari komponen React.
 */
import { createProductUnitFlow, type CreateProductUnitInput, type CreateProductUnitOutput } from './create-product-unit-flow';

// Fungsi wrapper yang aman untuk dipanggil dari komponen client/server Next.js
export async function createProductUnit(input: CreateProductUnitInput): Promise<CreateProductUnitOutput> {
  // Panggil flow secara langsung, Genkit akan menanganinya
  return await createProductUnitFlow(input);
}
