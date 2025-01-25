import { Env } from 'hono';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../../core/events/EventBus';

// User context in requests
export interface User {
  id: string;
  role: string;
  familyId?: string;
}

// Module-specific variables
export interface BankingBindings {
  prisma: PrismaClient;
  eventBus: EventBus;
  user?: User;
}

// Environment type for Hono
export type BankingEnv = Env & {
  Variables: {
    user?: User;
  };
  Bindings: BankingBindings;
};

// Helper type for controllers
export type BankingContext = {
  prisma: PrismaClient;
  eventBus: EventBus;
  user?: User;
};