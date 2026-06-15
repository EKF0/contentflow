function getEnvVar(name: string, required = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? '';
}

export const env = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: getEnvVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  CLERK_SECRET_KEY: getEnvVar('CLERK_SECRET_KEY'),
  CLERK_WEBHOOK_SECRET: getEnvVar('CLERK_WEBHOOK_SECRET'),
  DATABASE_URL: getEnvVar('DATABASE_URL'),
} as const;
