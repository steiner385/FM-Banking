import { EventBus } from '../../../core/events/EventBus';
import { AccountInterface } from '../interfaces/AccountInterface';

// Event Types
export type AccountEventType = 
  | 'account.created'
  | 'account.updated'
  | 'account.deleted'
  | 'account.balance.updated'
  | 'account.withdrawn'
  | 'account.deposited';

export type AccountEventPayload = {
  account?: AccountInterface;
  accountId?: string;
  amount?: number;
  newBalance?: number;
  userId?: string;
  familyId?: string;
  metadata?: Record<string, unknown>;
};

export type AccountEvent = {
  type: AccountEventType;
  payload: AccountEventPayload;
  timestamp: Date;
};

// Event Handlers Type
export type AccountEventHandler = (event: AccountEvent) => Promise<void>;

// Event Bus Wrapper
export class BankingEventBus {
  private static instance: BankingEventBus;
  private handlers: Map<AccountEventType, Set<AccountEventHandler>>;
  private eventBus: EventBus;

  private constructor() {
    this.handlers = new Map();
    this.eventBus = EventBus.getInstance();
  }

  static getInstance(): BankingEventBus {
    if (!BankingEventBus.instance) {
      BankingEventBus.instance = new BankingEventBus();
    }
    return BankingEventBus.instance;
  }

  on(eventType: AccountEventType, handler: AccountEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  off(eventType: AccountEventType, handler: AccountEventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  async emit(eventType: AccountEventType, payload: AccountEventPayload): Promise<void> {
    const event: AccountEvent = {
      type: eventType,
      payload,
      timestamp: new Date()
    };

    // Emit to core event bus
    this.eventBus.emit(eventType, event);

    // Handle local subscribers
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      await Promise.all(
        Array.from(handlers).map(handler => handler(event))
      );
    }
  }

  // Default handlers
  registerDefaultHandlers(): void {
    // Log all events
    this.on('account.created', async (event) => {
      console.log(`Account created: ${event.payload.account?.id}`);
    });

    this.on('account.balance.updated', async (event) => {
      console.log(
        `Account ${event.payload.accountId} balance updated to ${event.payload.newBalance}`
      );
    });

    // Add audit trail
    this.on('account.withdrawn', async (event) => {
      console.log(
        `Withdrawal from account ${event.payload.accountId}: ${event.payload.amount}`
      );
      // TODO: Add audit trail entry
    });

    this.on('account.deposited', async (event) => {
      console.log(
        `Deposit to account ${event.payload.accountId}: ${event.payload.amount}`
      );
      // TODO: Add audit trail entry
    });
  }
}