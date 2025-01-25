import { z } from 'zod';

// Entity Types
export type BankingEntityType = 'ACCOUNT' | 'TRANSACTION' | 'LOAN' | 'MARKETPLACE' | 'MODULE';

// Account Types
export const VALID_ACCOUNT_TYPES = ['SAVINGS', 'CHECKING', 'ALLOWANCE'] as const;
export const AccountTypeEnum = z.enum(VALID_ACCOUNT_TYPES);
export type AccountType = z.infer<typeof AccountTypeEnum>;

// Base Types
export interface BankingEntityBase {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Account Types
export interface AccountData {
  id?: string;
  name: string;
  type: AccountType;
  familyId: string;
  userId: string;
  balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AccountResponse extends BankingEntityBase, Omit<AccountData, 'id' | 'createdAt' | 'updatedAt'> {}

// Filter Types
export interface AccountFilters {
  type?: AccountType;
  userId?: string;
  familyId?: string;
  minBalance?: number;
  maxBalance?: number;
  sortBy?: keyof AccountResponse;
  order?: 'asc' | 'desc';
}

// Error Types
export interface BankingError {
  code: string;
  message: string;
  entity?: BankingEntityType;
  details?: Record<string, unknown>;
}

// Response Types
export interface BankingResponse<T> {
  success: boolean;
  data?: T;
  error?: BankingError;
}