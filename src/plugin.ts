import { BasePlugin } from '../../sdk/core/BasePlugin';
import { PluginConfig, PluginHealthCheck } from '../../sdk/core/types';
import { Event } from '../../sdk/events/types';
import { z } from 'zod';
import { prisma } from './prisma/client';
import { Context } from 'hono';
import { RouteDefinition } from '../../sdk/core/routes';
import { AccountController } from './controllers/account/AccountController';
import { AccountStatus } from './types';
import { BankingError } from './errors/BankingError';

/**
 * Plugin configuration schema
 */
const configSchema = z.object({
  features: z.object({
    accounts: z.boolean().default(true),
    transactions: z.boolean().default(true),
    budgeting: z.boolean().default(false)
  }),
  roles: z.object({
    canCreateAccounts: z.array(z.string()).default(['PARENT']),
    canViewAccounts: z.array(z.string()).default(['PARENT', 'CHILD']),
    canManageTransactions: z.array(z.string()).default(['PARENT'])
  }),
  limits: z.object({
    maxAccounts: z.number().min(1).default(10),
    maxTransactionsPerDay: z.number().min(1).default(100)
  })
});

type BankingPluginConfig = z.infer<typeof configSchema>;

/**
 * Banking plugin that provides banking and financial management capabilities
 */
export class BankingPlugin extends BasePlugin {
  private accountController: AccountController;
  private metricsInterval?: NodeJS.Timeout;
  private metrics = {
    totalAccounts: 0,
    activeAccounts: 0,
    totalTransactions: 0
  };

  constructor() {
    const config: PluginConfig = {
      metadata: {
        name: 'banking-plugin',
        version: '1.0.0',
        description: 'Banking and financial management capabilities',
        author: 'FamilyManager',
        license: 'MIT'
      },
      config: configSchema,
      events: {
        subscriptions: ['user.created', 'family.updated'],
        publications: [
          'account.created',
          'account.updated',
          'account.deleted',
          'transaction.created'
        ]
      }
    };

    super(config);

    // Initialize controllers
    this.accountController = new AccountController(prisma);

    // Add routes
    this.config.routes = this.getRoutes();
  }

  /**
   * Initialize plugin
   */
  async onInit(): Promise<void> {
    this.context.logger.info('Initializing banking plugin');
    await this.updateMetrics();
  }

  /**
   * Start plugin
   */
  async onStart(): Promise<void> {
    this.context.logger.info('Starting banking plugin');
    this.metricsInterval = setInterval(() => this.updateMetrics(), 60000);
  }

  /**
   * Stop plugin
   */
  async onStop(): Promise<void> {
    this.context.logger.info('Stopping banking plugin');
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }

  /**
   * Handle events
   */
  protected async handleEvent(event: Event): Promise<void> {
    const config = this.context.config as BankingPluginConfig;

    switch (event.type) {
      case 'user.created':
        if (config.features.accounts) {
          await this.accountController.handleUserCreated(event.data);
        }
        break;

      case 'family.updated':
        await this.accountController.handleFamilyUpdated(event.data);
        break;
    }
  }

  /**
   * Define plugin routes
   */
  private getRoutes(): RouteDefinition[] {
    const config = this.context.config as BankingPluginConfig;
    const routes: RouteDefinition[] = [];

    if (config.features.accounts) {
      routes.push(
        {
          path: '/api/banking/accounts',
          method: 'POST' as const,
          handler: async (c: Context) => {
            const user = c.get('user');
            if (!config.roles.canCreateAccounts.includes(user.role)) {
              return c.json({
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'User not authorized to create accounts'
                }
              }, 403);
            }
            return this.accountController.createAccount(c);
          },
          description: 'Create a new bank account'
        },
        {
          path: '/api/banking/accounts/:id',
          method: 'GET' as const,
          handler: this.accountController.getAccount.bind(this.accountController),
          description: 'Get account by ID'
        },
        {
          path: '/api/banking/families/:familyId/accounts',
          method: 'GET' as const,
          handler: this.accountController.getFamilyAccounts.bind(this.accountController),
          description: 'List family accounts'
        }
      );
    }

    return routes;
  }

  /**
   * Update metrics
   */
  private async updateMetrics(): Promise<void> {
    try {
      const [total, active, transactions] = await Promise.all([
        prisma.countAccounts(),
        prisma.countAccounts({ status: AccountStatus.ACTIVE }),
        prisma.countTransactions()
      ]);

      this.metrics = {
        totalAccounts: total,
        activeAccounts: active,
        totalTransactions: transactions
      };
    } catch (error) {
      this.context.logger.error('Error updating metrics', error as Error);
    }
  }

  /**
   * Get plugin health status
   */
  async getHealth(): Promise<PluginHealthCheck> {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: 'healthy',
        timestamp: Date.now(),
        message: 'Plugin is healthy',
        metrics: this.metrics
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        error,
        message: 'Database connection failed'
      };
    }
  }
}
