// Ensure .env is loaded before anything else
if (!process.env.DB_USERNAME) {
  try {
    require('dotenv').config();
  } catch (e) {
    // If require fails (ESM), fallback to dynamic import
    await import('dotenv').then(dotenv => dotenv.config()).catch(() => {});
  }
}

import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import process from 'process';

let __filename = new URL(import.meta.url).pathname;
// Remove leading slash on Windows (e.g., /C:/path -> C:/path)
if (process.platform === 'win32' && __filename.startsWith('/')) {
  __filename = __filename.slice(1);
}
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

// Prefer JS env-based config if present, otherwise read JSON
const configPath = path.join(__dirname, '../config/config.json');
const jsConfigPath = path.join(__dirname, '../config/config.js');
let configFile;
if (fs.existsSync(jsConfigPath)) {
  try {
    const imported = await import(`file://${jsConfigPath}`);
    configFile = imported.default || imported;
  } catch (err) {
    console.error('Error importing config/config.js; falling back to config.json', err);
  }
}
if (!configFile) {
  configFile = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

const env = process.env.NODE_ENV || 'development';
// Replace string env references with actual values
const configRaw = configFile[env];
const config = { ...configRaw };
for (const key in config) {
  if (typeof config[key] === 'string' && config[key].startsWith('process.env.')) {
    const envVar = config[key].replace('process.env.', '');
    config[key] = process.env[envVar];
  }
}
const db = {};

// Add SSL options for PostgreSQL only when requested.
// Use DB_SSL=true in .env to enable SSL (useful for managed DBs like Aiven).
if (config.dialect === 'postgres') {
  const host = config.host || '';
  const envRequiresSSL = process.env.DB_SSL === 'true' || process.env.DB_REQUIRE_SSL === 'true';
  const hostLooksLikeAiven = typeof host === 'string' && host.includes('aiven');
  if (envRequiresSSL || hostLooksLikeAiven || process.env.NODE_ENV === 'production') {
    config.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  }
}

// Destructure config for Sequelize
const { database, username, password, host, port, dialect, use_env_variable, ...restConfig } = config;

// Fatal check for dialect (after destructuring)
if (!dialect) {
  console.error('FATAL: Sequelize dialect is missing. Check your .env and config/config.json.');
  console.error('Current config:', { database, username, password, host, port, dialect });
  process.exit(1);
}

let sequelize;

// If a full DATABASE_URL is provided in the environment (e.g. from Aiven), prefer it.
// This enables quick switching to managed databases without changing config files.
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  // Determine dialect (default to postgres for Aiven URLs)
  const inferredDialect = (dbUrl && dbUrl.startsWith('postgres')) ? 'postgres' : (dialect || 'postgres');

  // Build dialectOptions for SSL. Respect existing config.dialectOptions if present.
  const envSsl = (config.dialectOptions && config.dialectOptions.ssl) ? config.dialectOptions.ssl : null;
  let sslOptions = envSsl || {
    require: true,
    // default to allowing self-signed certs for convenience; can be tightened below
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' ? true : false
  };

  // If a CA is provided (either PEM text, base64 PEM, or a file path), load it and enforce cert validation.
  if (process.env.DB_SSL_CA) {
    let ca = process.env.DB_SSL_CA;
    try {
      // if DB_SSL_CA points to an existing file path, read it
      if (fs.existsSync(ca)) {
        ca = fs.readFileSync(ca, 'utf8');
      }
    } catch (e) {
      // ignore file-read errors; we'll try to interpret value as PEM/base64 below
    }

    // If the value doesn't look like PEM, try base64 decode (convenience for env files)
    if (typeof ca === 'string' && !ca.includes('-----BEGIN CERTIFICATE-----')) {
      try {
        const decoded = Buffer.from(ca, 'base64').toString('utf8');
        if (decoded.includes('-----BEGIN CERTIFICATE-----')) {
          ca = decoded;
        }
      } catch (e) {
        // ignore decode errors
      }
    }

    // attach CA and enforce validation unless explicitly disabled
    sslOptions.ca = ca;
    if (process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false') {
      sslOptions.rejectUnauthorized = true;
    }
  }

  const dialectOpts = inferredDialect === 'postgres' ? { ssl: sslOptions } : {};

  sequelize = new Sequelize(dbUrl, {
    dialect: inferredDialect,
    protocol: inferredDialect,
    dialectOptions: dialectOpts,
    logging: false,
    ...restConfig
  });

} else if (use_env_variable) {
  sequelize = new Sequelize(process.env[use_env_variable], {
    host,
    port,
    dialect,
    ...restConfig
  });
} else {
  sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect,
    ...restConfig
  });
}

// Get all model files
const files = fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  });

// Load all models - using async/await with for...of for sequential loading
for (const file of files) {
  const modelPath = path.join(__dirname, file);
  
  // Convert file:// URL to file path for Windows compatibility
  const fileUrl = `file://${modelPath}`;
  
  try {
    // Import the model module
    const modelModule = await import(fileUrl);
    
    // Initialize the model - assuming model files export a function as default
    const model = modelModule.default(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  } catch (error) {
    console.error(`Error loading model from file ${file}:`, error);
  }
}

// Set up model associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});


// Test the database connection and sync models (auto-create tables)
async function testAndSync() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database or sync models:', error);
  }
}
testAndSync();

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;