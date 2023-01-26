import { knex as createKnex, Knex as KnexType } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

let client: KnexType | null = null;

/**
 * Create an Knex instance
 * @param {Partial<KnexType.Config>} options
 * @returns {KnexType}
 */
export function getInstance(options: Partial<KnexType.Config> = {}): KnexType {
  if (client) {
    return client;
  }

  // database
  const DB_HOST: any = process.env.POSTGRESQL_HOST;
  const DB_USER: any = process.env.POSTGRESQL_USER;
  const DB_PWD: any = process.env.POSTGRESQL_PWD;
  const DB_NAME: any = process.env.POSTGRESQL_DBNAME;
  const DB_PORT: any = process.env.POSTGRESQL_PORT;

  client = createKnex({
    client: 'pg',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PWD,
      database: DB_NAME,
      ...(process.env.SSL_CA_CERT
        ? {
            ssl: {
              ca: process.env.SSL_CA_CERT
            }
          }
        : {})
    },
    pool: { min: 0, max: 7 },
    ...options
  });
  return client;
}

export async function getTransaction(): Promise<
  KnexType.Transaction<any, any[]>
> {
  const knexTrx = await getInstance().transaction();
  return knexTrx;
}

export default {
  getInstance,
  getTransaction
};
