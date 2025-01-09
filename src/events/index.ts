/**
 * Banking events module exports
 */

export * from './BankingEventEmitter';

// Export a singleton instance for convenience
import { BankingEventEmitter } from './BankingEventEmitter';
export const bankingEvents = BankingEventEmitter.getInstance();
