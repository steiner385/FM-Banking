export type BankingEntityType = 'ACCOUNT' | 'TRANSACTION' | 'LOAN' | 'MARKETPLACE' | 'MODULE' | 'FAMILY' | 'USER';

export interface BankingErrorParams {
  code: string;
  message: string;
  entity?: BankingEntityType;
  details?: Record<string, unknown>;
}

export class BankingError extends Error {
  readonly code: string;
  readonly entity?: BankingEntityType;
  readonly details?: Record<string, unknown>;

  constructor(params: BankingErrorParams) {
    super(params.message);
    this.code = params.code;
    this.entity = params.entity;
    this.details = params.details;
    this.name = 'BankingError';
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, BankingError);
  }
}
