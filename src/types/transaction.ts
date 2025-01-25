import { z } from 'zod';

export const TransactionTypeEnum = z.enum([
  'TRANSFER',
  'DEPOSIT',
  'WITHDRAWAL',
  'PAYMENT',
  'REFUND'
]);

export const TransactionStatusEnum = z.enum([
  'PENDING_APPROVAL',
  'COMPLETED',
  'REJECTED',
  'FAILED',
  'CANCELLED',
  'REVERSED'
]);

export const TransactionSchema = z.object({
  id: z.string().optional(),
  type: TransactionTypeEnum,
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  sourceAccountId: z.string(),
  destinationAccountId: z.string().optional(),
  status: TransactionStatusEnum.default('PENDING_APPROVAL'),
  category: z.string(),
  approverNotes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  familyId: z.string()
}).refine(
  data => {
    if (data.type === 'TRANSFER' && !data.destinationAccountId) {
      return false;
    }
    return true;
  },
  {
    message: 'Destination account is required for transfers',
    path: ['destinationAccountId']
  }
);

export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionType = z.infer<typeof TransactionTypeEnum>;
export type TransactionStatus = z.infer<typeof TransactionStatusEnum>;

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  sourceAccountId?: string;
  destinationAccountId?: string;
  familyId?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface TransactionResult {
  transaction: Transaction;
  sourceAccount: {
    id: string;
    balance: number;
    user: {
      id: string;
      name: string;
    };
  };
  destinationAccount?: {
    id: string;
    balance: number;
    user: {
      id: string;
      name: string;
    };
  };
}

export interface TransactionRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  category: string;
}

export interface TransactionApproval {
  approverNotes?: string;
}

export interface TransactionRejection {
  rejectionReason: string;
}