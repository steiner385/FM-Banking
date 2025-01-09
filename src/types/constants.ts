export const AccountType = {
  SAVINGS: 'SAVINGS',
  ALLOWANCE: 'ALLOWANCE',
  CHECKING: 'CHECKING',
} as const;

export type AccountType = typeof AccountType[keyof typeof AccountType];

export const UserRole = {
  PARENT: 'PARENT',
  CHILD: 'CHILD',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
