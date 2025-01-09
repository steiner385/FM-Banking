import { eventBus } from '../../../../core/events';
import { EventDeliveryStatus } from '../../../../core/events/types';
import { BankingEventEmitter, BankingEventType } from '../BankingEventEmitter';
import { createMockHandler, waitForEvents } from '../../../../core/events/__tests__/utils/test-helpers';

describe('BankingEventEmitter', () => {
  let emitter: BankingEventEmitter;

  beforeEach(async () => {
    await eventBus.start();
    emitter = BankingEventEmitter.getInstance();
  });

  afterEach(async () => {
    try {
      await eventBus.stop();
    } catch (error) {
      // Ignore errors if bus is already stopped
    }
    BankingEventEmitter.resetInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = BankingEventEmitter.getInstance();
      const instance2 = BankingEventEmitter.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('transaction events', () => {
    it('should emit transaction created events', async () => {
      const { handler, calls } = createMockHandler();
      await eventBus.subscribe(handler, { channel: 'banking' });

      const transactionData = { id: '123', amount: 100 };
      await emitter.emitTransactionCreated(transactionData);
      await waitForEvents();

      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe(BankingEventType.TRANSACTION_CREATED);
      expect(calls[0].source).toBe('banking-service');
      expect(calls[0].metadata?.payload).toEqual(transactionData);
    });

    it('should emit transaction updated events', async () => {
      const { handler, calls } = createMockHandler();
      await eventBus.subscribe(handler, { channel: 'banking' });

      const transactionData = { id: '123', amount: 200 };
      await emitter.emitTransactionUpdated(transactionData);
      await waitForEvents();

      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe(BankingEventType.TRANSACTION_UPDATED);
      expect(calls[0].metadata?.payload).toEqual(transactionData);
    });

    it('should emit transaction deleted events', async () => {
      const { handler, calls } = createMockHandler();
      await eventBus.subscribe(handler, { channel: 'banking' });

      await emitter.emitTransactionDeleted('123');
      await waitForEvents();

      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe(BankingEventType.TRANSACTION_DELETED);
      expect(calls[0].metadata?.payload).toEqual({ transactionId: '123' });
    });
  });

  describe('account events', () => {
    it('should emit account created events', async () => {
      const { handler, calls } = createMockHandler();
      await eventBus.subscribe(handler, { channel: 'banking' });

      const accountData = { id: 'acc123', name: 'Savings' };
      await emitter.emitAccountCreated(accountData);
      await waitForEvents();

      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe(BankingEventType.ACCOUNT_CREATED);
      expect(calls[0].metadata?.payload).toEqual(accountData);
    });

    it('should emit account updated events', async () => {
      const { handler, calls } = createMockHandler();
      await eventBus.subscribe(handler, { channel: 'banking' });

      const accountData = { id: 'acc123', name: 'Updated Savings' };
      await emitter.emitAccountUpdated(accountData);
      await waitForEvents();

      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe(BankingEventType.ACCOUNT_UPDATED);
      expect(calls[0].metadata?.payload).toEqual(accountData);
    });

    it('should emit account deleted events', async () => {
      const { handler, calls } = createMockHandler();
      await eventBus.subscribe(handler, { channel: 'banking' });

      await emitter.emitAccountDeleted('acc123');
      await waitForEvents();

      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe(BankingEventType.ACCOUNT_DELETED);
      expect(calls[0].metadata?.payload).toEqual({ accountId: 'acc123' });
    });

    it('should emit balance updated events', async () => {
      const { handler, calls } = createMockHandler();
      await eventBus.subscribe(handler, { channel: 'banking' });

      await emitter.emitBalanceUpdated('acc123', 1000);
      await waitForEvents();

      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe(BankingEventType.BALANCE_UPDATED);
      expect(calls[0].metadata?.payload).toEqual({ accountId: 'acc123', balance: 1000 });
    });
  });

  describe('loan events', () => {
    it('should emit loan payment due events', async () => {
      const { handler, calls } = createMockHandler();
      await eventBus.subscribe(handler, { channel: 'banking' });

      await emitter.emitLoanPaymentDue('loan123', 500, '2025-02-01');
      await waitForEvents();

      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe(BankingEventType.LOAN_PAYMENT_DUE);
      expect(calls[0].metadata?.payload).toEqual({
        loanId: 'loan123',
        amount: 500,
        dueDate: '2025-02-01'
      });
    });

    it('should emit loan payment made events', async () => {
      const { handler, calls } = createMockHandler();
      await eventBus.subscribe(handler, { channel: 'banking' });

      await emitter.emitLoanPaymentMade('loan123', 500, '2025-01-15');
      await waitForEvents();

      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe(BankingEventType.LOAN_PAYMENT_MADE);
      expect(calls[0].metadata?.payload).toEqual({
        loanId: 'loan123',
        amount: 500,
        paymentDate: '2025-01-15'
      });
    });
  });

  describe('error events', () => {
    it('should emit banking error events', async () => {
      const { handler, calls } = createMockHandler();
      await eventBus.subscribe(handler, { channel: 'banking' });

      const error = new Error('Transaction failed');
      await emitter.emitBankingError(error);
      await waitForEvents();

      expect(calls).toHaveLength(1);
      expect(calls[0].type).toBe(BankingEventType.BANKING_ERROR);
      expect(calls[0].metadata?.payload).toEqual({ error });
    });
  });

  describe('event delivery', () => {
    it('should deliver events only to banking channel subscribers', async () => {
      const { handler: bankingHandler, calls: bankingCalls } = createMockHandler();
      const { handler: otherHandler, calls: otherCalls } = createMockHandler();

      await eventBus.subscribe(bankingHandler, { channel: 'banking' });
      await eventBus.subscribe(otherHandler, { channel: 'other' });

      await emitter.emitAccountCreated({ id: 'acc123' });
      await waitForEvents();

      expect(bankingCalls).toHaveLength(1);
      expect(otherCalls).toHaveLength(0);
    });

    it('should deliver events to global subscribers', async () => {
      const { handler, calls } = createMockHandler();
      await eventBus.subscribe(handler); // No channel = global subscriber

      await emitter.emitAccountCreated({ id: 'acc123' });
      await waitForEvents();

      expect(calls).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should handle failed event delivery', async () => {
      const error = new Error('Handler failed');
      const handler = async () => { throw error; };
      
      await eventBus.subscribe(handler, { channel: 'banking' });
      
      const timestamp = Date.now();
      const results = await eventBus.publish(
        {
          type: BankingEventType.ACCOUNT_CREATED,
          timestamp,
          source: 'test',
          metadata: {
            timestamp,
            source: 'test',
            payload: { id: 'acc123' }
          }
        },
        { channel: 'banking' }
      );
      
      expect(results.status).toBe(EventDeliveryStatus.FAILED);
      expect(results.errors).toContain(error.message);
    });
  });
});
