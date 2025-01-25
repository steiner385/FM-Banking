// Domain model
export { Account } from './Account';

// Service layer
export { AccountService } from './AccountService';

// Repository layer
export { AccountRepository } from './AccountRepository';

// Controller layer
export { AccountController } from './AccountController';

// Types
export type { AccountInterface } from '../../interfaces/AccountInterface';

// Initialize component
export function initializeAccountComponent(deps: { prisma: any }) {
  const repository = new AccountRepository(deps.prisma);
  const service = new AccountService(repository);
  const controller = new AccountController(service);

  return {
    repository,
    service,
    controller,
    routes: [
      {
        method: 'POST',
        path: '/accounts',
        handler: controller.createAccount,
        middleware: ['validateParentRole']
      },
      {
        method: 'GET',
        path: '/accounts/:id',
        handler: controller.getAccount
      },
      {
        method: 'GET',
        path: '/families/:familyId/accounts',
        handler: controller.getFamilyAccounts
      }
    ]
  };
}