require("dotenv").config();

const sslEnabled =
  process.env.DB_SSL === "true" || process.env.NODE_ENV === "production";

const commonConfig = {
  port: process.env.DB_PORT || 5432,
  dialect: "postgres",
};

const sslDialectOptions = sslEnabled
  ? {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }
  : {};

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    ...commonConfig,
    ...sslDialectOptions,
  },

  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    ...commonConfig,
    ...sslDialectOptions,
  },

  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
