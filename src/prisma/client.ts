import { PrismaClient } from '@prisma/client';
import { AccountType, AccountStatus, TransactionType, TransactionStatus, Currency, BankAccount, Transaction } from '../types';

export class CustomPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error']
    });
  }

  async findAccountById(id: string): Promise<BankAccount | null> {
    const result = await this.$queryRaw<BankAccount[]>`
      SELECT * FROM "BankAccount"
      WHERE id = ${id}
      LIMIT 1
    `;
    return result[0] || null;
  }

  async findAccountsByUserId(userId: string): Promise<BankAccount[]> {
    return this.$queryRaw<BankAccount[]>`
      SELECT * FROM "BankAccount"
      WHERE "userId" = ${userId}
    `;
  }

  async findAccountsByFamilyId(familyId: string): Promise<BankAccount[]> {
    return this.$queryRaw<BankAccount[]>`
      SELECT * FROM "BankAccount"
      WHERE "familyId" = ${familyId}
    `;
  }

  async createAccount(data: {
    name: string;
    type: AccountType;
    balance?: number;
    currency?: Currency;
    userId: string;
    familyId: string;
  }): Promise<BankAccount> {
    const result = await this.$queryRaw<BankAccount[]>`
      INSERT INTO "BankAccount" (
        id,
        name,
        type,
        balance,
        currency,
        status,
        "userId",
        "familyId",
        "createdAt",
        "updatedAt"
      ) VALUES (
        uuid_generate_v4(),
        ${data.name},
        ${data.type},
        ${data.balance || 0},
        ${data.currency || Currency.USD},
        ${AccountStatus.ACTIVE},
        ${data.userId},
        ${data.familyId},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;
    
    if (!result[0]) {
      throw new Error('Failed to create account');
    }
    
    return result[0];
  }

  async createTransaction(data: {
    type: TransactionType;
    amount: number;
    currency?: Currency;
    description?: string;
    accountId: string;
    userId: string;
    familyId: string;
  }): Promise<Transaction> {
    const result = await this.$queryRaw<Transaction[]>`
      INSERT INTO "Transaction" (
        id,
        type,
        amount,
        currency,
        description,
        status,
        "accountId",
        "userId",
        "familyId",
        "createdAt",
        "updatedAt"
      ) VALUES (
        uuid_generate_v4(),
        ${data.type},
        ${data.amount},
        ${data.currency || Currency.USD},
        ${data.description || null},
        ${TransactionStatus.PENDING},
        ${data.accountId},
        ${data.userId},
        ${data.familyId},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Failed to create transaction');
    }

    return result[0];
  }

  async countAccounts(where?: { userId?: string; familyId?: string; status?: AccountStatus }): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM "BankAccount" WHERE 1=1`;
    const params: any[] = [];

    if (where?.userId) {
      query += ` AND "userId" = $${params.length + 1}`;
      params.push(where.userId);
    }

    if (where?.familyId) {
      query += ` AND "familyId" = $${params.length + 1}`;
      params.push(where.familyId);
    }

    if (where?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(where.status);
    }

    const [result] = await this.$queryRawUnsafe<[{ count: string }]>(query, ...params);
    return Number(result.count);
  }

  async countTransactions(where?: { accountId?: string; userId?: string; familyId?: string }): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM "Transaction" WHERE 1=1`;
    const params: any[] = [];

    if (where?.accountId) {
      query += ` AND "accountId" = $${params.length + 1}`;
      params.push(where.accountId);
    }

    if (where?.userId) {
      query += ` AND "userId" = $${params.length + 1}`;
      params.push(where.userId);
    }

    if (where?.familyId) {
      query += ` AND "familyId" = $${params.length + 1}`;
      params.push(where.familyId);
    }

    const [result] = await this.$queryRawUnsafe<[{ count: string }]>(query, ...params);
    return Number(result.count);
  }
}

export const prisma = new CustomPrismaClient();
