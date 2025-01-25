import { eventBus } from '../../../core/events';
import { BaseEvent } from '../../../core/events/types';
import { SingletonBase } from '../../../core/patterns/singleton';
import { v4 as uuidv4 } from 'uuid';

/**
 * Banking event types
 */
export enum BankingEventType {
  TRANSACTION_CREATED = 'banking.transaction.created',
  TRANSACTION_UPDATED = 'banking.transaction.updated',
  TRANSACTION_DELETED = 'banking.transaction.deleted',
  ACCOUNT_CREATED = 'banking.account.created',
  ACCOUNT_UPDATED = 'banking.account.updated',
  ACCOUNT_DELETED = 'banking.account.deleted',
  BALANCE_UPDATED = 'banking.balance.updated',
  LOAN_PAYMENT_DUE = 'banking.loan.payment.due',
  LOAN_PAYMENT_MADE = 'banking.loan.payment.made',
  BANKING_ERROR = 'banking.error'
}

/**
 * Banking event payload types
 */
export interface BankingEventPayload {
  [BankingEventType.TRANSACTION_CREATED]: unknown;
  [BankingEventType.TRANSACTION_UPDATED]: unknown;
  [BankingEventType.TRANSACTION_DELETED]: { transactionId: string };
  [BankingEventType.ACCOUNT_CREATED]: unknown;
  [BankingEventType.ACCOUNT_UPDATED]: unknown;
  [BankingEventType.ACCOUNT_DELETED]: { accountId: string };
  [BankingEventType.BALANCE_UPDATED]: { accountId: string; balance: number };
  [BankingEventType.LOAN_PAYMENT_DUE]: { loanId: string; amount: number; dueDate: string };
  [BankingEventType.LOAN_PAYMENT_MADE]: { loanId: string; amount: number; paymentDate: string };
  [BankingEventType.BANKING_ERROR]: { error: Error };
}

/**
 * Banking event emitter for publishing banking-related events
 */
export class BankingEventEmitter extends SingletonBase {
  private static instance: BankingEventEmitter | null = null;
  private readonly CHANNEL = 'banking';
  private readonly SOURCE = 'banking-service';

  protected constructor() {
    super();
  }

  public static getInstance(): BankingEventEmitter {
    if (!BankingEventEmitter.instance) {
      BankingEventEmitter.instance = new BankingEventEmitter();
    }
    return BankingEventEmitter.instance;
  }

  /**
   * Creates a banking event with the specified type and payload
   */
  private createEvent<T extends BankingEventType>(
    type: T,
    payload: BankingEventPayload[T]
  ): BaseEvent {
    const timestamp = Date.now();
    return {
      id: uuidv4(),
      channel: this.CHANNEL,
      type,
      timestamp,
      source: this.SOURCE,
      metadata: {
        payload
      }
    };
  }

  private async publishEvent(event: BaseEvent): Promise<void> {
    await eventBus.publish(event);
  }

  /**
   * Transaction events
   */
  public async emitTransactionCreated(transactionData: unknown): Promise<void> {
    await this.publishEvent(
      this.createEvent(BankingEventType.TRANSACTION_CREATED, transactionData)
    );
  }

  public async emitTransactionUpdated(transactionData: unknown): Promise<void> {
    await this.publishEvent(
      this.createEvent(BankingEventType.TRANSACTION_UPDATED, transactionData)
    );
  }

  public async emitTransactionDeleted(transactionId: string): Promise<void> {
    await this.publishEvent(
      this.createEvent(BankingEventType.TRANSACTION_DELETED, { transactionId })
    );
  }

  /**
   * Account events
   */
  public async emitAccountCreated(accountData: unknown): Promise<void> {
    await this.publishEvent(
      this.createEvent(BankingEventType.ACCOUNT_CREATED, accountData)
    );
  }

  public async emitAccountUpdated(accountData: unknown): Promise<void> {
    await this.publishEvent(
      this.createEvent(BankingEventType.ACCOUNT_UPDATED, accountData)
    );
  }

  public async emitAccountDeleted(accountId: string): Promise<void> {
    await this.publishEvent(
      this.createEvent(BankingEventType.ACCOUNT_DELETED, { accountId })
    );
  }

  public async emitBalanceUpdated(accountId: string, balance: number): Promise<void> {
    await this.publishEvent(
      this.createEvent(BankingEventType.BALANCE_UPDATED, { accountId, balance })
    );
  }

  /**
   * Loan events
   */
  public async emitLoanPaymentDue(loanId: string, amount: number, dueDate: string): Promise<void> {
    await this.publishEvent(
      this.createEvent(BankingEventType.LOAN_PAYMENT_DUE, { loanId, amount, dueDate })
    );
  }

  public async emitLoanPaymentMade(loanId: string, amount: number, paymentDate: string): Promise<void> {
    await this.publishEvent(
      this.createEvent(BankingEventType.LOAN_PAYMENT_MADE, { loanId, amount, paymentDate })
    );
  }

  /**
   * Error events
   */
  public async emitBankingError(error: Error): Promise<void> {
    await this.publishEvent(
      this.createEvent(BankingEventType.BANKING_ERROR, { error })
    );
  }

  /**
   * Resets the singleton instance (primarily for testing purposes).
   */
  public static resetInstance(): void {
    BankingEventEmitter.instance = null;
  }
}
