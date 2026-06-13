require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'amie_user',
      password: process.env.DB_PASSWORD || 'amie_password',
      database: process.env.DB_NAME || 'amie_db',
    },
    migrations: {
      directory: './migrations',
      extension: 'js',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './migrations',
      extension: 'js',
      tableName: 'knex_migrations',
    },
  },
};