import faker from '@faker-js/faker';
import clients from '../../../clients';
import { serializeUser } from '../../../models/user.model';
import { IUser } from '../../../types/interfaces';

const seedUser = async (data = {}): Promise<IUser> => {
  const fakeData = {
    id: faker.datatype
      .number({ min: 100000, max: 999999, precision: 1 })
      .toString(),
    email: faker.internet.email('', '', 'gmail'),
    password: faker.internet.password(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    customerId: 'cus_' + faker.datatype.uuid(),
    timezone: '+7 UTC',
    currency: 'USD',
    ...data
  };

  const knexClient = clients.knex.getInstance();
  await knexClient('users').insert(fakeData);
  const [user] = await knexClient('users').select('*').where('id', fakeData.id);
  return serializeUser(user);
};

const deleteUser = async (id: any) => {
  const knexClient = clients.knex.getInstance();
  await knexClient('users').where({ id }).del();
};

export { seedUser, deleteUser };
