export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  ALLOWANCE = 'ALLOWANCE',
  INVESTMENT = 'INVESTMENT'
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED'
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP'
}

export interface BankAccount {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  type: AccountType;
  balance: number;
  currency: Currency;
  status: AccountStatus;
  userId: string;
  familyId: string;
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  type: TransactionType;
  amount: number;
  currency: Currency;
  description?: string | null;
  status: TransactionStatus;
  accountId: string;
  account?: BankAccount;
  userId: string;
  familyId: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency?: Currency;
  initialBalance?: number;
  familyId: string;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  currency?: Currency;
  description?: string;
  accountId: string;
  familyId: string;
}

export interface UserCreatedEvent {
  userId: string;
  familyId: string;
  role: string;
}

export interface FamilyUpdatedEvent {
  familyId: string;
  name: string;
  members: Array<{
    id: string;
    role: string;
  }>;
}
