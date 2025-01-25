import { Context } from 'hono';
import { LoanService } from '../../services/banking/loan.service';

export class LoanController {
  constructor(private loanService: LoanService) {}

  async requestLoan(c: Context) {
    const data = await c.req.json();
    const loan = await this.loanService.requestLoan(data);
    return c.json({ data: loan });
  }

  async getLoan(c: Context) {
    const { id } = c.req.param();
    const loan = await this.loanService.getLoan(id);
    return c.json({ data: loan });
  }

  async getUserLoans(c: Context) {
    const { userId } = c.req.param();
    const { role, status } = c.req.query();
    const loans = await this.loanService.getUserLoans(userId, { role, status });
    return c.json({ data: loans });
  }

  async approveLoan(c: Context) {
    const { id } = c.req.param();
    const data = await c.req.json();
    const loan = await this.loanService.approveLoan(id, data);
    return c.json({ data: loan });
  }

  async makeLoanPayment(c: Context) {
    const { id } = c.req.param();
    const { amount, note } = await c.req.json();
    const payment = await this.loanService.makeLoanPayment(id, amount, note);
    return c.json({ data: payment });
  }
}
