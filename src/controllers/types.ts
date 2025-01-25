import { Context } from 'hono';

export interface ControllerInterface {
  createAccount(c: Context): Promise<Response>;
  getAccount(c: Context): Promise<Response>;
  getFamilyAccounts(c: Context): Promise<Response>;
}