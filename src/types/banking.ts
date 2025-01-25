export interface BankAccount {
  id: string;
  name: string;
  type: 'SAVINGS' | 'CHECKING' | 'ALLOWANCE';
  familyId: string;
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  category: 'ALLOWANCE' | 'REWARD' | 'TRANSFER' | 'PAYMENT';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: string;
  borrowerId: string;
  lenderId: string;
  amount: number;
  interestRate: number;
  termDays: number;
  purpose: string;
  repaymentSchedule: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ONCE';
  status: 'PENDING' | 'ACTIVE' | 'LATE' | 'DEFAULTED' | 'COMPLETED' | 'CANCELLED';
  collateral?: {
    type: 'ALLOWANCE' | 'FUTURE_REWARDS' | 'SAVINGS';
    details: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  sellerId: string;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  images: string[];
  tags: string[];
  status: 'AVAILABLE' | 'PENDING_APPROVAL' | 'PENDING_PAYMENT' | 'SOLD' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}
