import "dotenv/config";
import { config as loadEnv } from "dotenv";

import { prisma } from "../lib/prisma";
import { syncScrapedTournament } from "../src/domain/sync-tournament";
import { fetchNcFusionCupTournament } from "../src/scraping/nc-fusion-cup";

loadEnv({ path: ".env.local", override: false });

async function main() {
  const sourceUrl = process.env.NC_FUSION_CUP_URL;

  if (!sourceUrl) {
    throw new Error("Set NC_FUSION_CUP_URL before running bun run db:seed.");
  }

  const scraped = await fetchNcFusionCupTournament(sourceUrl);
  const result = await syncScrapedTournament(scraped);

  console.log(`Seeded ${result.tournament.name} ${result.tournament.season}`);
  console.log(`Division: ${scraped.division ?? "Unknown"}`);
  console.log(`Groups: ${result.groups}`);
  console.log(`Teams: ${result.teams}`);
  console.log(`Matches: ${result.matches}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
