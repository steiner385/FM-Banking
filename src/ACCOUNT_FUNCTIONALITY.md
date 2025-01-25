# Account Management Functionality

## Current Implementation

### Routes
```typescript
bankingRouter.post('/accounts', parentRoleMiddleware(), accountController.createAccount);
bankingRouter.get('/accounts/:id', accountController.getAccount);
bankingRouter.get('/families/:familyId/accounts', accountController.getFamilyAccounts);
```

### Access Control
1. Account Creation
   - Requires authentication
   - PARENT role only
   - Must belong to family

2. Account Retrieval
   - Requires authentication
   - Any family member can view
   - Limited to own family accounts

### Validation Rules
1. Account Creation
   - Name is required
   - Valid account type (SAVINGS, CHECKING, ALLOWANCE)
   - Valid family ID
   - Valid user ID (must belong to family)
   - Initial balance >= 0

2. Account Types
   - SAVINGS
   - CHECKING
   - ALLOWANCE

### Error Handling
1. Validation Errors (400)
   ```json
   {
     "error": {
       "message": "Missing required fields",
       "details": {
         "name": "Name is required",
         "type": "Type is required",
         "familyId": "Family ID is required",
         "userId": "User ID is required"
       }
     }
   }
   ```

2. Not Found (404)
   ```json
   {
     "error": {
       "message": "Account not found"
     }
   }
   ```

3. Unauthorized (403)
   ```json
   {
     "error": {
       "message": "Only parents can perform this operation"
     }
   }
   ```

### Database Schema
```prisma
model BankAccount {
  id        String   @id @default(uuid())
  name      String
  type      String
  balance   Float    @default(0)
  familyId  String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id])
  family Family @relation(fields: [familyId], references: [id])
}
```

## Integration Points

### Authentication System
- Uses authMiddleware
- Requires valid JWT token
- Sets user context in request

### Role System
- Uses parentRoleMiddleware
- Checks user.role === 'PARENT'
- Applied to account creation

### Family System
- Validates family relationships
- Ensures user belongs to family
- Handles family-wide account listing

## Success Responses

1. Account Creation (201)
   ```json
   {
     "data": {
       "id": "uuid",
       "name": "Account Name",
       "type": "SAVINGS",
       "balance": 100,
       "familyId": "family-id",
       "userId": "user-id",
       "createdAt": "2024-01-01T00:00:00.000Z",
       "updatedAt": "2024-01-01T00:00:00.000Z"
     }
   }
   ```

2. Account Retrieval (200)
   ```json
   {
     "data": {
       "id": "uuid",
       "name": "Account Name",
       "type": "SAVINGS",
       "balance": 100,
       "familyId": "family-id",
       "userId": "user-id",
       "createdAt": "2024-01-01T00:00:00.000Z",
       "updatedAt": "2024-01-01T00:00:00.000Z"
     }
   }
   ```

3. Family Accounts (200)
   ```json
   {
     "data": [
       {
         "id": "uuid",
         "name": "Account Name",
         "type": "SAVINGS",
         "balance": 100,
         "familyId": "family-id",
         "userId": "user-id",
         "createdAt": "2024-01-01T00:00:00.000Z",
         "updatedAt": "2024-01-01T00:00:00.000Z"
       }
     ]
   }
   ```

## Migration Requirements

1. Preserve Functionality
   - Keep all current endpoints
   - Maintain validation rules
   - Keep error formats
   - Preserve response structures

2. Maintain Integration
   - Auth middleware compatibility
   - Role middleware compatibility
   - Family system integration
   - Error handling patterns

3. Testing Strategy
   - Validate current behavior
   - Test with existing clients
   - Verify error cases
   - Check authorization rules