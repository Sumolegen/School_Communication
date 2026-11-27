import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  appName: process.env.APP_NAME ?? 'School Communication',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '10', 10),
  uploadStorageDriver: process.env.UPLOAD_STORAGE_DRIVER ?? 'local',
  uploadDir: process.env.UPLOAD_DIR ?? '',
}));
