module.exports = {
  development: {
    username: process.env.DB_USERNAME || '<DB_USERNAME>',
    password: process.env.DB_PASSWORD || '<DB_PASSWORD>',
    database: process.env.DB_NAME || 'oasis',
    host: process.env.DB_HOST || '<DB_HOST>',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 20252,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  test: {
    username: process.env.DB_USERNAME || '<DB_USERNAME>',
    password: process.env.DB_PASSWORD || '<DB_PASSWORD>',
    database: process.env.DB_NAME || '<DB_NAME>',
    host: process.env.DB_HOST || '<DB_HOST>',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 20252,
    dialect: 'postgres'
  },
  production: {
    username: process.env.DB_USERNAME || '<DB_USERNAME>',
    password: process.env.DB_PASSWORD || '<DB_PASSWORD>',
    database: process.env.DB_NAME || '<DB_NAME>',
    host: process.env.DB_HOST || '<DB_HOST>',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 20252,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
