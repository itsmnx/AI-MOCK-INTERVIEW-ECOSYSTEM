import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'amie_user',
    password: process.env.DB_PASSWORD || 'amie_password',
    database: process.env.DB_NAME || 'amie_db',
  },
  pool: {
    min: 2,
    max: 10
  }
});

export default db;
