import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local", override: false });

const datasourceUrl =
  process.env.LOCAL_DATABASE_URL ??
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error(
    "Set LOCAL_DATABASE_URL for local Postgres, or DATABASE_URL_UNPOOLED/DIRECT_URL for Neon.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: datasourceUrl,
  },
});
