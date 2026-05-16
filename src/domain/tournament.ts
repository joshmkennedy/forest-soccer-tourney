import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const tournamentWithDetails = {
  groups: {
    include: {
      teams: {
        include: {
          stats: true,
        },
      },
    },
  },
  teams: {
    include: {
      stats: true,
      group: true,
    },
  },
  matches: {
    include: {
      home: true,
      away: true,
      winner: true,
    },
    orderBy: {
      date: "asc",
    },
  },
} satisfies Prisma.TournamentInclude;

export type TournamentWithDetails = Prisma.TournamentGetPayload<{
  include: typeof tournamentWithDetails;
}>;

export function createTournament(data: Prisma.TournamentCreateInput) {
  return prisma.tournament.create({ data });
}

export function upsertTournament(data: Prisma.TournamentCreateInput & { name: string; season: string }) {
  return prisma.tournament.upsert({
    where: {
      name_season: {
        name: data.name,
        season: data.season,
      },
    },
    create: data,
    update: {
      sourceUrl: data.sourceUrl,
    },
  });
}

export function listTournaments() {
  return prisma.tournament.findMany({
    orderBy: [{ season: "desc" }, { name: "asc" }],
  });
}

export function getTournament(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: tournamentWithDetails,
  });
}

export function updateTournament(id: string, data: Prisma.TournamentUpdateInput) {
  return prisma.tournament.update({
    where: { id },
    data,
  });
}

export function deleteTournament(id: string) {
  return prisma.tournament.delete({
    where: { id },
  });
}
