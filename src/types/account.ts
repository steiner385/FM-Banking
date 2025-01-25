import { z } from 'zod';

export const BankAccountSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT']),
  familyId: z.string(),
  userId: z.string(),
  balance: z.number().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional()
});

export type BankAccount = z.infer<typeof BankAccountSchema>;

export interface BankAccountFilters {
  type?: string;
  userId?: string;
  familyId?: string;
  minBalance?: number;
  maxBalance?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface BankAccountCredentials {
  accountNumber?: string;
  routingNumber?: string;
  institutionId?: string;
  [key: string]: unknown;
}

export interface BankAccountSettings {
  overdraftProtection?: boolean;
  notificationThresholds?: number[];
  autoTransferRules?: {
    targetAccountId: string;
    threshold: number;
    amount: number;
  }[];
  [key: string]: unknown;
}