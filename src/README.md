# Banking Module

## Overview
The Banking Module provides core banking functionality for the Family Manager application. It handles account management, transactions, and role-based access control.

## Current Status
Phase 1 implementation with core account management functionality.

### Implemented Features
- Account creation (PARENT role only)
- Role-based access control
- Basic validation
- Error handling

### Planned Features
- Transaction management
- Balance updates
- Family-wide operations
- Event system integration

## Usage

### Mounting the Module
```typescript
import { Hono } from 'hono';
import bankingRouter from './modules/banking';

const app = new Hono();
app.route('/api/banking', bankingRouter);
```

### Creating an Account
```typescript
// POST /api/banking/accounts
{
  "name": "Savings Account",
  "type": "SAVINGS",
  "familyId": "family-id",
  "userId": "user-id",
  "initialBalance": 100
}
```

## Integration Points

### Authentication
The module expects the following context variables:
- `userId`: The authenticated user's ID
- `userRole`: The user's role (PARENT/CHILD)

### Error Handling
All errors follow the standard format:
```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { /* Additional error details */ }
  }
}
```

### Response Format
All successful responses follow the format:
```typescript
{
  "success": true,
  "data": { /* Response data */ }
}
```

## Role-Based Access
- Account Creation: PARENT role only
- Account Viewing: All family members
- Balance Updates: Planned feature

## Module Boundaries
- Uses Prisma for data access
- Integrates with authentication system
- Emits events for important state changes (planned)
- Maintains its own validation rules

## Development
See TRANSFORMATION.md for the module transformation plan and progress.