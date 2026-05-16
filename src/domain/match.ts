import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

const matchInclude = {
  tournament: true,
  home: true,
  away: true,
  winner: true,
} satisfies Prisma.MatchInclude;

export type MatchWithTeams = Prisma.MatchGetPayload<{
  include: typeof matchInclude;
}>;

export function createMatch(data: Prisma.MatchCreateInput) {
  return prisma.match.create({
    data,
    include: matchInclude,
  });
}

export async function upsertMatchByScheduleSlot(data: {
  tournamentId: string;
  homeTeamId?: string;
  awayTeamId?: string;
  date: Date;
  stage: Prisma.MatchCreateInput["stage"];
  field?: string;
  homeScore?: number;
  awayScore?: number;
  winnerTeamId?: string;
}) {
  const existing = await prisma.match.findFirst({
    where: {
      tournamentId: data.tournamentId,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      date: data.date,
      field: data.field,
    },
  });

  const writeData = {
    tournamentId: data.tournamentId,
    homeTeamId: data.homeTeamId,
    awayTeamId: data.awayTeamId,
    winnerTeamId: data.winnerTeamId,
    date: data.date,
    stage: data.stage,
    field: data.field,
    homeScore: data.homeScore,
    awayScore: data.awayScore,
  };

  if (existing) {
    return prisma.match.update({
      where: { id: existing.id },
      data: writeData,
      include: matchInclude,
    });
  }

  return prisma.match.create({
    data: writeData,
    include: matchInclude,
  });
}

export function listMatches(tournamentId: string) {
  return prisma.match.findMany({
    where: { tournamentId },
    include: matchInclude,
    orderBy: { date: "asc" },
  });
}

export function getMatch(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: matchInclude,
  });
}

export function updateMatch(id: string, data: Prisma.MatchUpdateInput) {
  return prisma.match.update({
    where: { id },
    data,
    include: matchInclude,
  });
}

export function deleteMatch(id: string) {
  return prisma.match.delete({
    where: { id },
  });
}
