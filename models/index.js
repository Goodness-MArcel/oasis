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

// Use fs to read config.json for compatibility
const configPath = path.join(__dirname, '../config/config.json');
const configFile = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

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

// Add SSL options for Aiven PostgreSQL
if (config.dialect === 'postgres') {
  config.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  };
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
if (use_env_variable) {
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