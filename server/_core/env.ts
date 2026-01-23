const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn(
    "[Environment] WARNING: JWT_SECRET is not set! Using an insecure default for development.",
  );
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "driver-panic-button-dev",
  cookieSecret: JWT_SECRET ?? "dev_insecure_secret_fallback",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
