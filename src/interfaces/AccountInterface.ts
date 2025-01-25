import { AccountType } from '../types';

export interface AccountInterface {
  id?: string;
  name: string;
  type: AccountType;
  familyId: string;
  userId: string;
  balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AccountRepositoryInterface {
  create(data: Omit<AccountInterface, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccountInterface>;
  findById(id: string): Promise<AccountInterface | null>;
  findByFamily(familyId: string, options?: {
    type?: AccountType;
    userId?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<AccountInterface[]>;
  updateBalance(id: string, amount: number): Promise<AccountInterface>;
}

export interface AccountServiceInterface {
  createAccount(data: {
    name: string;
    type: string;
    familyId: string;
    userId: string;
    initialBalance: number;
  }): Promise<AccountInterface>;
  
  getAccount(id: string): Promise<AccountInterface>;
  
  getFamilyAccounts(familyId: string, options?: {
    type?: AccountType;
    userId?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<AccountInterface[]>;
  
  updateBalance(id: string, amount: number): Promise<AccountInterface>;
}