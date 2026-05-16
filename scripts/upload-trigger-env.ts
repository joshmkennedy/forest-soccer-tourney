import { envvars } from "@trigger.dev/sdk";
import { parse } from "dotenv";
import { existsSync, readFileSync } from "node:fs";

const PROJECT_REF = "proj_aobbkkjkesgpfqlxnkwt";
const REQUIRED_KEYS = ["DATABASE_URL", "NC_FUSION_CUP_URL"] as const;

type TriggerEnv = "dev" | "staging" | "prod";

const options = parseArgs(process.argv.slice(2));
const variables = readVariables(options.file);
const triggerSecretKey = process.env.TRIGGER_SECRET_KEY ?? variables.TRIGGER_SECRET_KEY;

if (!triggerSecretKey) {
  throw new Error(
    "Set TRIGGER_SECRET_KEY before running this script. Use the Trigger.dev secret key for the target environment."
  );
}

process.env.TRIGGER_SECRET_KEY = triggerSecretKey;
const selectedVariables = options.all ? variables : pickVariables(variables, REQUIRED_KEYS);
delete selectedVariables.TRIGGER_SECRET_KEY;
delete selectedVariables.TRIGGER_ACCESS_TOKEN;
const missingKeys = REQUIRED_KEYS.filter((key) => !selectedVariables[key]);

if (!options.all && missingKeys.length > 0) {
  throw new Error(
    `Missing required env var(s) in ${options.file}: ${missingKeys.join(", ")}`
  );
}

await envvars.upload(PROJECT_REF, options.env, {
  variables: selectedVariables,
  override: options.override,
});

console.log(
  `Uploaded ${Object.keys(selectedVariables).length} env var(s) to Trigger.dev ${options.env}.`
);
console.log(`Project: ${PROJECT_REF}`);
console.log(`Keys: ${Object.keys(selectedVariables).sort().join(", ")}`);

function parseArgs(args: string[]) {
  const options = {
    env: "prod" as TriggerEnv,
    file: ".env.production",
    override: true,
    all: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--env") {
      if (!isTriggerEnv(next)) {
        throw new Error("--env must be one of: dev, staging, prod");
      }

      options.env = next;
      index += 1;
      continue;
    }

    if (arg === "--file") {
      if (!next) {
        throw new Error("--file requires a path");
      }

      options.file = next;
      index += 1;
      continue;
    }

    if (arg === "--all") {
      options.all = true;
      continue;
    }

    if (arg === "--no-override") {
      options.override = false;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function readVariables(file: string) {
  if (!existsSync(file)) {
    throw new Error(`Env file not found: ${file}`);
  }

  return parse(readFileSync(file, "utf-8"));
}

function pickVariables(
  variables: Record<string, string>,
  keys: readonly string[]
) {
  return Object.fromEntries(
    keys
      .filter((key) => variables[key])
      .map((key) => [key, variables[key]])
  );
}

function isTriggerEnv(value: string | undefined): value is TriggerEnv {
  return value === "dev" || value === "staging" || value === "prod";
}
