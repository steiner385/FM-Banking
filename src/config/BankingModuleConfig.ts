import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../../core/events/EventBus';

export interface BankingModuleContext {
  app: Hono;
  prisma: PrismaClient;
  eventBus: EventBus;
}

export interface BankingModuleFeatures {
  accounts: boolean;
  transactions: boolean;
  loans: boolean;
  marketplace: boolean;
  allowanceSystem: boolean;
}

export interface BankingModuleRoles {
  canCreateAccounts: string[];
  canApproveTransactions: string[];
  canManageLoans: string[];
  canAccessMarketplace: string[];
}

export interface BankingModuleConfig {
  name: string;
  version: string;
  features: BankingModuleFeatures;
  roles: BankingModuleRoles;
  limits: {
    maxTransactionAmount: number;
    dailyTransactionLimit: number;
    minAccountBalance: number;
  };
}

export const defaultConfig: BankingModuleConfig = {
  name: 'banking',
  version: '1.0.0',
  features: {
    accounts: true,
    transactions: true,
    loans: true,
    marketplace: true,
    allowanceSystem: true
  },
  roles: {
    canCreateAccounts: ['PARENT'],
    canApproveTransactions: ['PARENT'],
    canManageLoans: ['PARENT'],
    canAccessMarketplace: ['PARENT', 'CHILD']
  },
  limits: {
    maxTransactionAmount: 1000,
    dailyTransactionLimit: 5000,
    minAccountBalance: 0
  }
};

export function validateConfig(config: Partial<BankingModuleConfig>): BankingModuleConfig {
  return {
    ...defaultConfig,
    ...config,
    features: { ...defaultConfig.features, ...config.features },
    roles: { ...defaultConfig.roles, ...config.roles },
    limits: { ...defaultConfig.limits, ...config.limits }
  };
}