import { Context } from 'hono';
import { TransactionService } from '../../services/banking/transaction.service';

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  async requestTransaction(c: Context) {
    const data = await c.req.json();
    const transaction = await this.transactionService.requestTransaction(data);
    return c.json({ data: transaction });
  }

  async createTransaction(c: Context) {
    const data = await c.req.json();
    const transaction = await this.transactionService.createTransaction(data);
    return c.json({ data: transaction });
  }

  async approveTransaction(c: Context) {
    const { id } = c.req.param();
    const { approverNotes } = await c.req.json();
    const transaction = await this.transactionService.approveTransaction(id, approverNotes);
    return c.json({ data: transaction });
  }

  async rejectTransaction(c: Context) {
    const { id } = c.req.param();
    const { rejectionReason } = await c.req.json();
    const transaction = await this.transactionService.rejectTransaction(id, rejectionReason);
    return c.json({ data: transaction });
  }
}
