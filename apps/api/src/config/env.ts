import { config } from 'dotenv';
import { ApiEnvSchema, type ApiEnv } from '@sms/types';

config(); // loads apps/api/.env from cwd

function loadEnv(): ApiEnv {
  const parsed = ApiEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    // eslint-disable-next-line no-console
    console.error(`\u274c Invalid environment configuration:\n${issues}`);
    process.exit(1);
  }
  return parsed.data;
}

export const env: ApiEnv = loadEnv();
