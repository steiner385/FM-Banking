import type { PluginContext } from '../../../core/plugin/types';
import type { AccountInterface } from '../interfaces/AccountInterface';
import type { BankAccount } from '@prisma/client';

export interface BankingModuleLifecycle {
  // Initialization hooks
  beforeInitialize?(context: PluginContext): Promise<void>;
  afterInitialize?(context: PluginContext): Promise<void>;

  // Account hooks
  beforeCreateAccount?(account: Partial<AccountInterface>): Promise<Partial<AccountInterface>>;
  afterCreateAccount?(account: BankAccount): Promise<void>;

  beforeUpdateAccount?(accountId: string, account: Partial<AccountInterface>): Promise<Partial<AccountInterface>>;
  afterUpdateAccount?(account: BankAccount): Promise<void>;

  // Transaction hooks
  beforeTransaction?(transaction: {
    sourceAccountId: string;
    destinationAccountId?: string;
    amount: number;
    type: string;
  }): Promise<void>;
  afterTransaction?(transaction: {
    id: string;
    sourceAccountId: string;
    destinationAccountId?: string;
    amount: number;
    type: string;
    status: string;
  }): Promise<void>;

  // Balance hooks
  beforeBalanceUpdate?(accountId: string, amount: number): Promise<void>;
  afterBalanceUpdate?(account: BankAccount): Promise<void>;

  // Error hooks
  onError?(error: Error): Promise<void>;

  // Cleanup hooks
  beforeTeardown?(): Promise<void>;
  afterTeardown?(): Promise<void>;
}