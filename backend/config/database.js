const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 20,
      min: 2,
      acquire: 10000,   // [FIX 10.4] fail fast: 10s instead of 30s — avoids hanging requests piling up
      idle: 10000,
      evict: 5000,      // check + remove idle connections every 5s
    },
  }
);

module.exports = sequelize;
