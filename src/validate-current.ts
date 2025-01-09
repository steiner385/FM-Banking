import { prisma } from '../../lib/prisma';
import { UserRole } from '../../types/user-role';

async function validateCurrentFunctionality() {
  console.log('Starting banking functionality validation...');

  try {
    // Create test family
    console.log('Creating test family...');
    const family = await prisma.family.create({
      data: {
        name: 'Test Family'
      }
    });

    // Create parent user
    console.log('Creating parent user...');
    const parent = await prisma.user.create({
      data: {
        email: 'parent@test.com',
        password: 'test-password',
        firstName: 'Parent',
        lastName: 'User',
        username: 'parent_test',
        role: UserRole.PARENT,
        familyId: family.id
      }
    });

    // Create child user
    console.log('Creating child user...');
    const child = await prisma.user.create({
      data: {
        email: 'child@test.com',
        password: 'test-password',
        firstName: 'Child',
        lastName: 'User',
        username: 'child_test',
        role: UserRole.CHILD,
        familyId: family.id
      }
    });

    // Test account creation
    console.log('Testing account creation...');
    const account = await prisma.bankAccount.create({
      data: {
        name: 'Test Account',
        type: 'SAVINGS',
        familyId: family.id,
        userId: parent.id,
        balance: 100
      }
    });

    console.log('Created account:', account);

    // Test account retrieval
    console.log('Testing account retrieval...');
    const retrievedAccount = await prisma.bankAccount.findUnique({
      where: { id: account.id }
    });

    console.log('Retrieved account:', retrievedAccount);

    // Test family accounts listing
    console.log('Testing family accounts listing...');
    const familyAccounts = await prisma.bankAccount.findMany({
      where: { familyId: family.id }
    });

    console.log('Family accounts:', familyAccounts);

    // Test validation rules
    console.log('Testing validation rules...');

    // Test invalid account type
    try {
      await prisma.bankAccount.create({
        data: {
          name: 'Invalid Account',
          type: 'INVALID_TYPE',
          familyId: family.id,
          userId: parent.id,
          balance: 100
        }
      });
      console.error('❌ Account type validation failed');
    } catch (error) {
      console.log('✓ Account type validation works');
    }

    // Test negative balance
    try {
      await prisma.bankAccount.create({
        data: {
          name: 'Negative Balance',
          type: 'SAVINGS',
          familyId: family.id,
          userId: parent.id,
          balance: -100
        }
      });
      console.error('❌ Balance validation failed');
    } catch (error) {
      console.log('✓ Balance validation works');
    }

    // Cleanup
    console.log('Cleaning up test data...');
    await prisma.bankAccount.deleteMany({
      where: { familyId: family.id }
    });
    await prisma.user.deleteMany({
      where: { familyId: family.id }
    });
    await prisma.family.delete({
      where: { id: family.id }
    });

    console.log('Validation completed successfully!');
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
validateCurrentFunctionality()
  .catch(console.error);