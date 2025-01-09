# FM-Banking Plugin

## Overview
FM-Banking is a modular banking plugin for the FamilyManager ecosystem, providing account management and financial tracking capabilities.

## Features
- Create and manage bank accounts
- Retrieve account details
- List accounts by family
- Event-driven architecture
- Robust error handling

## Installation
```bash
npm install fm-banking
```

## Configuration
```typescript
import { BankingModule } from 'fm-banking';
import { PrismaClient } from '@prisma/client';
import { EventBus } from 'your-event-bus';

const prisma = new PrismaClient();
const eventBus = new EventBus();

const bankingModule = BankingModule.getInstance();
await bankingModule.initialize({ 
  app, 
  prisma, 
  eventBus 
});
```

## API Endpoints
- `POST /api/banking/accounts`: Create a new account
- `GET /api/banking/accounts/:id`: Get account details
- `GET /api/banking/families/:familyId/accounts`: List accounts for a family

## Error Handling
The plugin uses Hono's HTTPException for standardized error responses.

## Dependencies
- Hono
- Prisma
- EventBus

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License.