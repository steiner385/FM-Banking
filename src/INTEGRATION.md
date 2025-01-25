# Banking System Integration Points

## Current System Analysis

### Account Management

#### Dependencies
- Authentication System
  - Uses authMiddleware for all routes
  - Requires user context in request
  - Expects user.role for authorization

- Role System
  - Uses parentRoleMiddleware for protected routes
  - PARENT role required for:
    - Account creation
    - Transaction approval
    - Loan approval
    - Purchase approval

- Family System
  - Family relationships for account access
  - Family-wide account listing
  - Family member validation

#### Integration Points
1. Authentication
```typescript
// All routes expect:
interface UserContext {
  id: string;
  role: string;
  familyId: string;
}
```

2. Role-Based Access
```typescript
// Protected routes check:
if (user.role !== 'PARENT') {
  return unauthorized();
}
```

3. Family Relationships
```typescript
// Family validation:
const family = await prisma.family.findUnique({
  where: { id: familyId },
  include: { members: true }
});

// Member validation:
if (!family || !family.members.some(m => m.id === userId)) {
  return unauthorized();
}
```

### Current Behavior

1. Account Creation
- Endpoint: POST /api/banking/accounts
- Requires PARENT role
- Validates:
  - Required fields (name, type, familyId, userId)
  - Account type (SAVINGS, CHECKING, ALLOWANCE)
  - Family exists and user belongs to family
  - Initial balance (defaults to 0)

2. Account Retrieval
- Endpoint: GET /api/banking/accounts/:id
- Available to all family members
- Returns:
  - Account details
  - Balance
  - Transaction history (if included)

3. Family Accounts
- Endpoint: GET /api/banking/families/:familyId/accounts
- Available to all family members
- Supports:
  - Type filtering
  - User filtering
  - Sorting options

### Error Handling
```typescript
// Current error format:
interface ErrorResponse {
  error: {
    message: string;
    details?: Record<string, unknown>;
  }
}
```

### Response Format
```typescript
// Success response:
interface SuccessResponse<T> {
  data: T;
}

// Error response (400, 401, 403, 404, 500):
interface ErrorResponse {
  error: {
    message: string;
    details?: unknown;
  }
}
```

## Transformation Requirements

1. Preserve Functionality
- Maintain all current endpoints
- Keep existing validation rules
- Support current error formats
- Preserve response structures

2. Maintain Compatibility
- Keep current route paths
- Support existing middleware
- Preserve error handling patterns
- Match response formats

3. Integration Points to Preserve
- Authentication integration
- Role-based access control
- Family relationship validation
- Error handling patterns
- Response formats

4. Testing Strategy
- Validate current behavior
- Test with existing clients
- Verify error cases
- Check authorization rules