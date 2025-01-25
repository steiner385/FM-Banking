import { z } from 'zod';
import { BankingError } from '../errors/BankingError';
import { AccountType, AccountTypeEnum } from '../types';

const AccountSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Account name is required'),
  type: AccountTypeEnum,
  familyId: z.string().min(1, 'Family ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  balance: z.number().min(0, 'Balance cannot be negative')
});

type AccountData = z.infer<typeof AccountSchema>;

export class Account {
  readonly id?: string;
  readonly name: string;
  readonly type: AccountType;
  readonly familyId: string;
  readonly userId: string;
  private _balance: number;

  private constructor(data: AccountData) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.familyId = data.familyId;
    this.userId = data.userId;
    this._balance = data.balance;
  }

  static create(data: unknown): Account {
    try {
      const validated = AccountSchema.parse(data);
      return new Account(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BankingError({
          code: 'VALIDATION_ERROR',
          message: error.errors[0].message,
          entity: 'ACCOUNT',
          details: { errors: error.errors }
        });
      }
      throw error;
    }
  }

  get balance(): number {
    return this._balance;
  }

  canWithdraw(amount: number): boolean {
    if (amount <= 0) {
      throw new BankingError({
        code: 'INVALID_AMOUNT',
        message: 'Withdrawal amount must be positive',
        entity: 'ACCOUNT'
      });
    }

    // Special handling for different account types
    // Different account types have different withdrawal rules
    if (this.type === 'ALLOWANCE') {
      // Allowance accounts must maintain minimum balance
      const minimumBalance = 0;
      return this._balance - amount >= minimumBalance;
    }
    
    // Regular accounts cannot go negative
    return this._balance >= amount;
  }

  withdraw(amount: number): void {
    if (!this.canWithdraw(amount)) {
      throw new BankingError({
        code: 'INSUFFICIENT_FUNDS',
        message: `Insufficient funds: available ${this._balance}, required ${amount}`,
        entity: 'ACCOUNT'
      });
    }
    this._balance -= amount;
  }

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new BankingError({
        code: 'INVALID_AMOUNT',
        message: 'Deposit amount must be positive',
        entity: 'ACCOUNT'
      });
    }
    this._balance += amount;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      familyId: this.familyId,
      userId: this.userId,
      balance: this._balance
    };
  }
}
