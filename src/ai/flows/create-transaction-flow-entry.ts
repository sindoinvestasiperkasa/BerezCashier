
'use server';
/**
 * @fileOverview This file is being deprecated as transaction logic moves to the client-side.
 * The Genkit flow is no longer called from the client.
 */

// The content of this file is intentionally left minimal as it's being phased out.
// Keeping the file avoids breaking any existing server-side imports if they exist,
// but the core functionality is now handled in app-provider.tsx.

export type CreateTransactionInput = any;
export type CreateTransactionOutput = any;

export async function createTransaction(input: CreateTransactionInput): Promise<CreateTransactionOutput> {
  // This log indicates that the deprecated flow is being called.
  console.warn("DEPRECATED: Server-side createTransaction flow was called. This logic has moved to the client.");
  
  // Return a failure or a specific message to indicate deprecation.
  return {
    success: false,
    transactionId: '',
    error: 'This server flow is deprecated. Use the client-side implementation.'
  };
}
