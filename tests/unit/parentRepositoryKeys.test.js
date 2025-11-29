jest.mock('../../src/repositories/dynamoRepository', () => ({
  createItem: jest.fn(async (table, item) => item),
  queryByEmail: jest.fn(async () => ({ items: [] }))
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async () => 'hashed-password'),
  compare: jest.fn(async () => true)
}));

const dynamoRepository = require('../../src/repositories/dynamoRepository');
const parentRepository = require('../../src/repositories/parentRepository');

describe('parentRepository single-table keys', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'secret';
  });

  test('createParent applies pk/sk/entityType', async () => {
    const parent = await parentRepository.createParent({
      email: 'user@example.com',
      password: 'password123'
    });

    expect(dynamoRepository.createItem).toHaveBeenCalledTimes(1);
    expect(parent.pk).toBe(`PARENT#${parent.id}`);
    expect(parent.sk).toBe(`PARENT#${parent.id}`);
    expect(parent.entityType).toBe('parent');
  });
});
