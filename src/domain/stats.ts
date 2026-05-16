import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const abbreviatedStats = {
  wins: "W",
  ties: "T",
  losses: "L",
  goalsFor: "GF",
  goalsAgainst: "GA",
  goalDifference: "GD",
  tieBreaker: "TB",
  points: "Pts",
} as const;

export function createStats(data: Prisma.StatsCreateInput) {
  return prisma.stats.create({ data });
}

export function getStatsForTeam(teamId: string) {
  return prisma.stats.findUnique({
    where: { teamId },
    include: { team: true },
  });
}

export function upsertStatsForTeam(teamId: string, data: Prisma.StatsUncheckedUpdateInput) {
  return prisma.stats.upsert({
    where: { teamId },
    create: {
      teamId,
      wins: Number(data.wins ?? 0),
      ties: Number(data.ties ?? 0),
      losses: Number(data.losses ?? 0),
      goalsFor: Number(data.goalsFor ?? 0),
      goalsAgainst: Number(data.goalsAgainst ?? 0),
      goalDifference: Number(data.goalDifference ?? 0),
      tieBreaker: data.tieBreaker === undefined ? undefined : Number(data.tieBreaker),
      points: Number(data.points ?? 0),
    },
    update: data,
  });
}

export function updateStats(id: string, data: Prisma.StatsUpdateInput) {
  return prisma.stats.update({
    where: { id },
    data,
  });
}

export function deleteStats(id: string) {
  return prisma.stats.delete({
    where: { id },
  });
}
