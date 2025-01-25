export interface CreateAccountData {
  familyId: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  initialBalance?: number;
}

export interface AccountServiceInterface {
  createAccount(data: CreateAccountData): Promise<any>;
  getAccount(accountId: string): Promise<any>;
  getFamilyAccounts(familyId: string): Promise<any[]>;
}