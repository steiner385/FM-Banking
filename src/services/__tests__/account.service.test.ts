import { AccountService, CreateAccountDTO } from '../account.service';
import { PrismaClient } from '@prisma/client';
import { AccountType } from '../../types/constants';
import { BankingError } from '../../types/errors';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    account: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

describe('AccountService', () => {
  let accountService: AccountService;
  let prisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    accountService = new AccountService();
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
  });

  describe('createAccount', () => {
    const mockAccountData: CreateAccountDTO = {
      name: 'Test Account',
      type: AccountType.SAVINGS,
      familyId: 'family-123',
      userId: 'user-123',
      initialBalance: 100,
    };

    it('should create an account successfully', async () => {
      const mockCreatedAccount = {
        id: 'account-123',
        ...mockAccountData,
        balance: mockAccountData.initialBalance!,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.account.create as jest.Mock).mockResolvedValue(mockCreatedAccount);

      const result = await accountService.createAccount(mockAccountData);

      expect(result).toEqual(mockCreatedAccount);
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          name: mockAccountData.name,
          type: mockAccountData.type,
          familyId: mockAccountData.familyId,
          userId: mockAccountData.userId,
          balance: mockAccountData.initialBalance,
        },
      });
    });

    it('should throw error when creation fails', async () => {
      (prisma.account.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await expect(accountService.createAccount(mockAccountData)).rejects.toThrow(
        BankingError
      );
    });
  });

  describe('getAccount', () => {
    const mockAccount = {
      id: 'account-123',
      name: 'Test Account',
      type: AccountType.SAVINGS,
      familyId: 'family-123',
      userId: 'user-123',
      balance: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return account for owner', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);

      const result = await accountService.getAccount(
        'account-123',
        'user-123',
        'CHILD'
      );

      expect(result).toEqual(mockAccount);
    });

    it('should return account for parent role', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);

      const result = await accountService.getAccount(
        'account-123',
        'different-user',
        'PARENT'
      );

      expect(result).toEqual(mockAccount);
    });

    it('should throw error for non-owner child role', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);

      await expect(
        accountService.getAccount('account-123', 'different-user', 'CHILD')
      ).rejects.toThrow(BankingError);
    });

    it('should throw error when account not found', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        accountService.getAccount('account-123', 'user-123', 'CHILD')
      ).rejects.toThrow(BankingError);
    });
  });
});
