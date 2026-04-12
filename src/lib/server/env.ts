import "server-only";

type EnvKey =
  | "PLAID_CLIENT_ID"
  | "PLAID_SECRET"
  | "REWARDSCC_API_KEY"
  | "ALPHA_VANTAGE_API_KEY"
  | "FEATHERLESS_API_KEY";

function requireEnv(key: EnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PLAID_CLIENT_ID: requireEnv("PLAID_CLIENT_ID"),
  PLAID_SECRET: requireEnv("PLAID_SECRET"),
  REWARDSCC_API_KEY: requireEnv("REWARDSCC_API_KEY"),
  ALPHA_VANTAGE_API_KEY: requireEnv("ALPHA_VANTAGE_API_KEY"),
  FEATHERLESS_API_KEY: requireEnv("FEATHERLESS_API_KEY"),
};

