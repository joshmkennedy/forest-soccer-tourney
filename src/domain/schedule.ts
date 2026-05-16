import { prisma } from "@/lib/prisma";

export function getTeamSchedule(teamId: string) {
  return prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    include: {
      tournament: true,
      home: true,
      away: true,
      winner: true,
    },
    orderBy: { date: "asc" },
  });
}

export function getUpcomingTeamSchedule(teamId: string, from = new Date()) {
  return prisma.match.findMany({
    where: {
      date: {
        gte: from,
      },
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    include: {
      tournament: true,
      home: true,
      away: true,
      winner: true,
    },
    orderBy: { date: "asc" },
  });
}
