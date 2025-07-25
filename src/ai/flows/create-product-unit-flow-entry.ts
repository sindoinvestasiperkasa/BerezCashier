
'use server';
/**
 * @fileOverview Entry point aman untuk memanggil alur createProductUnit dari komponen React.
 */
import { runFlow } from '@genkit-ai/next';
import { createProductUnitFlow, type CreateProductUnitInput, type CreateProductUnitOutput } from './create-product-unit-flow';

// Fungsi wrapper yang aman untuk dipanggil dari komponen client/server Next.js
export async function createProductUnit(input: CreateProductUnitInput): Promise<CreateProductUnitOutput> {
  return await runFlow(createProductUnitFlow, input);
}

    