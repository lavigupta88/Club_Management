require('dotenv').config();

const env = {
  port:          parseInt(process.env.PORT, 10) || 5000,
  nodeEnv:       process.env.NODE_ENV || 'development',
  db: {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'campus_events',
  },
  jwt: {
    secret:    process.env.JWT_SECRET    || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  phpServiceUrl: process.env.PHP_SERVICE_URL || 'http://localhost:8080',
  corsOrigin:    process.env.CORS_ORIGIN     || 'http://localhost:5173',
  uploadDir:     process.env.UPLOAD_DIR      || './uploads',
};

module.exports = env;
