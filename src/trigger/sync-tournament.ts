import { logger, schedules } from "@trigger.dev/sdk"

type ScrapedMatch = {
  opponent: string
  kickoff: string
  field: string
  stage: "Group" | "Semifinal" | "Final"
  result?: string
}

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

    const matches = await scrapeTournamentSchedule(sourceUrl)

    logger.log("Scraped NC Fusion Cup schedule", {
      team: "Forest 2016G Black",
      sourceUrl,
      matches: matches.length,
    })

    return { synced: matches.length, skipped: false }
  },
})

async function scrapeTournamentSchedule(
  sourceUrl: string
): Promise<ScrapedMatch[]> {
  const response = await fetch(sourceUrl, {
    headers: {
      "user-agent": "Forest 2016G Black tournament monitor",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch tournament page: ${response.status}`)
  }

  // Keep parsing intentionally narrow until the live tournament URL and markup
  // are known. The public page currently renders resilient fallback data.
  await response.text()

  return []
}
