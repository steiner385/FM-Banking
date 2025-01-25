import { Hono } from 'hono';
import { Context } from 'hono';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/events/EventBus';
import { BankingModuleConfig, BankingModuleContext, validateConfig } from './config/BankingModuleConfig';
import { AccountController } from './controllers/account/AccountController';
import { AccountService } from './services/account/AccountService';
import { AccountRepository } from './repositories/AccountRepository';
import { BankingError } from './errors/BankingError';

// Define custom environment type
interface BankingEnv {
  user?: {
    id: string;
    role: string;
  };
}

export class BankingModule {
  private static instance: BankingModule;
  private config: BankingModuleConfig;
  private context?: BankingModuleContext;
  private initialized = false;

  private constructor() {
    // Will be initialized in initialize()
    this.config = {} as BankingModuleConfig;
  }

  static getInstance(): BankingModule {
    if (!BankingModule.instance) {
      BankingModule.instance = new BankingModule();
    }
    return BankingModule.instance;
  }

  async initialize(
    context: BankingModuleContext,
    config?: Partial<BankingModuleConfig>
  ): Promise<void> {
    if (this.initialized) {
      throw new BankingError({
        code: 'MODULE_ERROR',
        message: 'Banking module already initialized',
        entity: 'MODULE'
      });
    }

    this.context = context;
    this.config = validateConfig(config || {});

    try {
      // Initialize repositories
      const accountRepository = new AccountRepository();

      // Initialize services
      const accountService = new AccountService(accountRepository);

      // Initialize controllers
      const accountController = new AccountController(accountService);

      // Register routes based on enabled features
      if (this.config.features.accounts) {
        this.registerAccountRoutes(context.app, accountController);
      }

      this.initialized = true;
    } catch (error) {
      throw new BankingError({
        code: 'INITIALIZATION_ERROR',
        message: 'Failed to initialize banking module',
        entity: 'MODULE',
        details: { error }
      });
    }
  }

  private registerAccountRoutes(app: Hono<{ Bindings: BankingEnv }>, controller: AccountController): void {
    const baseRoute = '/api/banking';

    app.post(`${baseRoute}/accounts`, async (c: Context<{ Bindings: BankingEnv }>) => {
      // Validate user role
      const user = c.get('user');
      if (!user || !this.config.roles.canCreateAccounts.includes(user.role)) {
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authorized to create accounts'
          }
        }, 403);
      }
      return controller.createAccount(c);
    });

    app.get(`${baseRoute}/accounts/:id`, async (c: Context<{ Bindings: BankingEnv }>) => {
      return controller.getAccount(c);
    });

    app.get(`${baseRoute}/families/:familyId/accounts`, async (c: Context<{ Bindings: BankingEnv }>) => {
      return controller.getFamilyAccounts(c);
    });
  }

  getConfig(): BankingModuleConfig {
    return { ...this.config };
  }

  async teardown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // Cleanup logic here
      this.initialized = false;
    } catch (error) {
      throw new BankingError({
        code: 'TEARDOWN_ERROR',
        message: 'Failed to teardown banking module',
        entity: 'MODULE',
        details: { error }
      });
    }
  }
}