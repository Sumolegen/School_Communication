import { execSync } from 'child_process';

try {
  execSync('npx prisma validate', { stdio: 'inherit' });
  console.log('Prisma schema verification passed.');
} catch (error) {
  console.error('Prisma schema verification failed:', error);
  process.exit(1);
}
