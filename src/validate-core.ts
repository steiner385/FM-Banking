import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';
import { UserRole } from '../../types/user-role';
import router from './index';

async function validateCore() {
  console.log('Starting core banking validation...');

  try {
    // Create test app
    const app = new Hono();
    app.route('/api/banking', router);

    // Create test family
    console.log('Creating test family...');
    const family = await prisma.family.create({
      data: { name: 'Test Family' }
    });

    // Create parent user
    console.log('Creating parent user...');
    const parent = await prisma.user.create({
      data: {
        email: 'test.parent@example.com',
        password: 'test-password',
        firstName: 'Test',
        lastName: 'Parent',
        username: 'test_parent',
        role: UserRole.PARENT,
        familyId: family.id
      }
    });

    // Test account creation as parent
    console.log('Testing account creation as parent...');
    const createResponse = await app.request('/api/banking/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': parent.id,
        'X-User-Role': UserRole.PARENT
      },
      body: JSON.stringify({
        name: 'Test Account',
        type: 'SAVINGS',
        familyId: family.id,
        userId: parent.id,
        initialBalance: 100
      })
    });

    console.log('Create response:', {
      status: createResponse.status,
      body: await createResponse.json()
    });

    // Create child user
    console.log('Creating child user...');
    const child = await prisma.user.create({
      data: {
        email: 'test.child@example.com',
        password: 'test-password',
        firstName: 'Test',
        lastName: 'Child',
        username: 'test_child',
        role: UserRole.CHILD,
        familyId: family.id
      }
    });

    // Test account creation as child (should fail)
    console.log('Testing account creation as child (should fail)...');
    const failedResponse = await app.request('/api/banking/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': child.id,
        'X-User-Role': UserRole.CHILD
      },
      body: JSON.stringify({
        name: 'Test Account',
        type: 'SAVINGS',
        familyId: family.id,
        userId: child.id,
        initialBalance: 100
      })
    });

    console.log('Failed response:', {
      status: failedResponse.status,
      body: await failedResponse.json()
    });

    // Cleanup
    console.log('Cleaning up...');
    await prisma.bankAccount.deleteMany({ where: { familyId: family.id } });
    await prisma.user.deleteMany({ where: { familyId: family.id } });
    await prisma.family.delete({ where: { id: family.id } });

    console.log('Validation completed successfully!');
  } catch (error) {
    console.error('Validation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
validateCore();