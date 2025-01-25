export class BankingError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'BankingError';
  }
}

export enum BankingErrorCode {
  INVALID_ACCOUNT_TYPE = 'INVALID_ACCOUNT_TYPE',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  INVALID_OPERATION = 'INVALID_OPERATION',
  USER_NOT_IN_FAMILY = 'USER_NOT_IN_FAMILY',
  FAMILY_NOT_FOUND = 'FAMILY_NOT_FOUND'
}
