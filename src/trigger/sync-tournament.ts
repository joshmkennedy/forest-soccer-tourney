import { logger, schedules } from "@trigger.dev/sdk"

import { syncScrapedTournament } from "@/src/domain/sync-tournament"
import { fetchNcFusionCupTournament } from "@/src/scraping/nc-fusion-cup"

export const syncTournamentSchedule = schedules.task({
  id: "sync-nc-fusion-cup",
  cron: {
    pattern: "*/30 * * * *",
    timezone: "America/New_York",
  },
  run: async () => {
    const sourceUrl = process.env.NC_FUSION_CUP_URL

    if (!sourceUrl) {
      logger.warn("NC_FUSION_CUP_URL is not configured; skipping scrape.")
      return { synced: 0, skipped: true }
    }

    const scraped = await fetchNcFusionCupTournament(sourceUrl)
    const result = await syncScrapedTournament(scraped)

    logger.log("Scraped NC Fusion Cup schedule", {
      team: "Forest 2016G Black",
      sourceUrl,
      groups: result.groups,
      matches: result.matches,
      teams: result.teams,
    })

    return { synced: result.matches, skipped: false }
  },
})
