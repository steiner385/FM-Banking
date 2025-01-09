import { prisma } from '../../../lib/prisma';
import { UserRole } from '../../../types/user-role';

async function validateBankingFunctionality() {
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

    // Test balance update
    console.log('Testing balance update...');
    const updatedAccount = await prisma.bankAccount.update({
      where: { id: account.id },
      data: {
        balance: {
          increment: 50
        }
      }
    });

    console.log('Updated account:', updatedAccount);

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
  }
}

// Run validation
validateBankingFunctionality()
  .catch(console.error)
  .finally(() => prisma.$disconnect());