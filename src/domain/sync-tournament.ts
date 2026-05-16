import type { ScrapedTournament } from "@/src/scraping/nc-fusion-cup";
import { upsertGroup } from "@/src/domain/group";
import { upsertMatchByScheduleSlot } from "@/src/domain/match";
import { upsertStatsForTeam } from "@/src/domain/stats";
import { upsertTeam } from "@/src/domain/team";
import { upsertTournament } from "@/src/domain/tournament";
import { prisma } from "@/lib/prisma";

export async function syncScrapedTournament(scraped: ScrapedTournament) {
  const tournament = await upsertTournament({
    name: scraped.name,
    season: scraped.season,
    sourceUrl: scraped.sourceUrl,
  });
  const teamsByName = new Map<string, { id: string }>();
  const syncedGroupIds: string[] = [];
  const syncedTeamIds: string[] = [];
  const syncedMatchIds: string[] = [];

  for (const groupSeed of scraped.groups) {
    const group = await upsertGroup({
      name: groupSeed.name,
      tournamentId: tournament.id,
    });
    syncedGroupIds.push(group.id);

    for (const teamSeed of groupSeed.teams) {
      const team = await upsertTeam({
        name: teamSeed.name,
        association: teamSeed.association,
        logoUrl: teamSeed.logoUrl,
        tournamentId: tournament.id,
        groupId: group.id,
      });

      await upsertStatsForTeam(team.id, teamSeed.stats);
      teamsByName.set(team.name, team);
      syncedTeamIds.push(team.id);
    }
  }

  for (const matchSeed of scraped.matches) {
    const homeTeamId = matchSeed.home ? teamsByName.get(matchSeed.home)?.id : undefined;
    const awayTeamId = matchSeed.away ? teamsByName.get(matchSeed.away)?.id : undefined;

    if (matchSeed.home && !homeTeamId) {
      throw new Error(`Scraped schedule references unknown home team: ${matchSeed.home}`);
    }

    if (matchSeed.away && !awayTeamId) {
      throw new Error(`Scraped schedule references unknown away team: ${matchSeed.away}`);
    }

    const match = await upsertMatchByScheduleSlot({
      tournamentId: tournament.id,
      homeTeamId,
      awayTeamId,
      date: matchSeed.date,
      stage: matchSeed.stage,
      field: matchSeed.field,
      homeScore: matchSeed.homeScore,
      awayScore: matchSeed.awayScore,
    });
    syncedMatchIds.push(match.id);
  }

  await prisma.match.deleteMany({
    where: {
      tournamentId: tournament.id,
      id: {
        notIn: syncedMatchIds,
      },
    },
  });

  await prisma.team.deleteMany({
    where: {
      tournamentId: tournament.id,
      id: {
        notIn: syncedTeamIds,
      },
    },
  });

  await prisma.group.deleteMany({
    where: {
      tournamentId: tournament.id,
      id: {
        notIn: syncedGroupIds,
      },
    },
  });

  return {
    tournament,
    groups: scraped.groups.length,
    teams: teamsByName.size,
    matches: scraped.matches.length,
  };
}
