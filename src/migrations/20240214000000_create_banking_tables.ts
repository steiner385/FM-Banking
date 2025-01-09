import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Bank Accounts table
  await knex.schema.createTable('bank_accounts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.enum('type', ['SAVINGS', 'CHECKING', 'ALLOWANCE']).notNullable();
    table.uuid('family_id').references('families.id').onDelete('CASCADE');
    table.uuid('user_id').references('users.id').onDelete('CASCADE');
    table.decimal('balance', 10, 2).notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  // Transactions table
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('from_account_id').references('bank_accounts.id').onDelete('CASCADE');
    table.uuid('to_account_id').references('bank_accounts.id').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('description');
    table.enum('category', ['ALLOWANCE', 'REWARD', 'TRANSFER', 'PAYMENT']).notNullable();
    table.enum('status', ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'])
      .notNullable()
      .defaultTo('PENDING_APPROVAL');
    table.timestamps(true, true);
  });

  // Loans table
  await knex.schema.createTable('loans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('borrower_id').references('users.id').onDelete('CASCADE');
    table.uuid('lender_id').references('users.id').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.decimal('interest_rate', 5, 2).notNullable();
    table.integer('term_days').notNullable();
    table.string('purpose').notNullable();
    table.enum('repayment_schedule', ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ONCE']).notNullable();
    table.enum('status', ['PENDING', 'ACTIVE', 'LATE', 'DEFAULTED', 'COMPLETED', 'CANCELLED'])
      .notNullable()
      .defaultTo('PENDING');
    table.jsonb('collateral');
    table.timestamps(true, true);
  });

  // Marketplace listings table
  await knex.schema.createTable('marketplace_listings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.uuid('seller_id').references('users.id').onDelete('CASCADE');
    table.enum('condition', ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']).notNullable();
    table.specificType('images', 'text[]');
    table.specificType('tags', 'text[]');
    table.enum('status', ['AVAILABLE', 'PENDING_APPROVAL', 'PENDING_PAYMENT', 'SOLD', 'CANCELLED'])
      .notNullable()
      .defaultTo('AVAILABLE');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('marketplace_listings');
  await knex.schema.dropTable('loans');
  await knex.schema.dropTable('transactions');
  await knex.schema.dropTable('bank_accounts');
}
