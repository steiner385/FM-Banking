# FM-Banking Module

## Overview
FM-Banking is a FamilyManager module that provides comprehensive banking and financial management capabilities. Built on top of the FamilyManager SDK, it offers both backend services and frontend components for managing family finances.

## Features

### Backend Features
- Account management (create, read, update, delete)
- Transaction tracking and history
- Family account sharing
- Budget management
- Expense categorization
- Event-driven updates
- Robust error handling

### Frontend Components
- Account dashboard
- Transaction list/details
- Budget overview
- Expense charts
- Account settings
- Transaction forms

## Installation

```bash
npm install @familymanager/banking --save
```

## Usage

### Backend Integration

```typescript
import { BankingModule } from '@familymanager/banking';
import { ModuleContext } from '@familymanager/sdk';

export class Banking extends BankingModule {
  async initialize(context: ModuleContext): Promise<void> {
    // Initialize module
    await this.setupDatabase();
    await this.registerRoutes();
    this.setupEventHandlers();
  }
}
```

### Frontend Components

```typescript
import { 
  AccountDashboard,
  TransactionList,
  BudgetOverview 
} from '@familymanager/banking/components';

function BankingView() {
  return (
    <div>
      <AccountDashboard />
      <TransactionList />
      <BudgetOverview />
    </div>
  );
}
```

### Event Handling

```typescript
import { useEventListener } from '@familymanager/sdk';

function BankingComponent() {
  useEventListener('banking:transaction-created', (data) => {
    // Handle new transaction
  });
}
```

## API Reference

### REST Endpoints

#### Accounts
- `POST /api/banking/accounts`: Create account
- `GET /api/banking/accounts/:id`: Get account details
- `GET /api/banking/families/:familyId/accounts`: List family accounts
- `PUT /api/banking/accounts/:id`: Update account
- `DELETE /api/banking/accounts/:id`: Delete account

#### Transactions
- `POST /api/banking/transactions`: Create transaction
- `GET /api/banking/transactions/:id`: Get transaction details
- `GET /api/banking/accounts/:accountId/transactions`: List account transactions

#### Budgets
- `POST /api/banking/budgets`: Create budget
- `GET /api/banking/budgets/:id`: Get budget details
- `PUT /api/banking/budgets/:id`: Update budget

### Events

#### Emitted Events
- `banking:account-created`
- `banking:account-updated`
- `banking:transaction-created`
- `banking:budget-updated`

#### Handled Events
- `family:member-added`
- `family:member-removed`
- `user:preferences-updated`

## Database Schema

```prisma
model Account {
  id          String   @id @default(uuid())
  name        String
  balance     Float
  familyId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  transactions Transaction[]
}

model Transaction {
  id          String   @id @default(uuid())
  accountId   String
  amount      Float
  description String
  category    String
  date        DateTime
  account     Account  @relation(fields: [accountId], references: [id])
}

model Budget {
  id          String   @id @default(uuid())
  familyId    String
  amount      Float
  category    String
  period      String
  startDate   DateTime
  endDate     DateTime
}
```

## Testing

### Unit Tests
```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### Test Utilities

```typescript
import { 
  createTestAccount,
  createTestTransaction,
  mockBankingModule 
} from '@familymanager/banking/testing';

describe('Banking Tests', () => {
  const mockModule = mockBankingModule();
  
  it('handles transactions', async () => {
    const account = await createTestAccount();
    const transaction = await createTestTransaction(account.id);
    // Test implementation
  });
});
```

## Development

### Prerequisites
- Node.js 18+
- FamilyManager SDK
- PostgreSQL

### Setup
```bash
# Install dependencies
npm install

# Set up database
npm run db:setup

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

### Building
```bash
# Build module
npm run build

# Build documentation
npm run docs
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your contributions:
- Follow the existing code style
- Include appropriate tests
- Update relevant documentation
- Consider backward compatibility

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Dependencies

### Required
- @familymanager/sdk: Core SDK
- @prisma/client: Database ORM
- react: Frontend framework
- redux: State management

### Development
- typescript: Type checking
- jest: Testing framework
- playwright: E2E testing
- eslint: Code linting
- prettier: Code formatting

## Support

- [Issue Tracker](https://github.com/familymanager/banking/issues)
- [Documentation](./docs)
- [Discussions](https://github.com/familymanager/banking/discussions)
