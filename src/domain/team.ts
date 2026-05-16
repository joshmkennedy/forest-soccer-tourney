import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function createTeam(data: Prisma.TeamCreateInput) {
  return prisma.team.create({ data });
}

export function upsertTeam(data: {
  name: string;
  association: string;
  logoUrl?: string;
  tournamentId: string;
  groupId?: string;
}) {
  return prisma.team.upsert({
    where: {
      tournamentId_name: {
        tournamentId: data.tournamentId,
        name: data.name,
      },
    },
    create: data,
    update: {
      association: data.association,
      logoUrl: data.logoUrl,
      groupId: data.groupId,
    },
  });
}

export function listTeams(tournamentId: string) {
  return prisma.team.findMany({
    where: { tournamentId },
    include: {
      group: true,
      stats: true,
    },
    orderBy: { name: "asc" },
  });
}

export function getTeam(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: {
      group: true,
      stats: true,
      homeMatches: {
        include: {
          away: true,
          winner: true,
        },
        orderBy: { date: "asc" },
      },
      awayMatches: {
        include: {
          home: true,
          winner: true,
        },
        orderBy: { date: "asc" },
      },
    },
  });
}

export function updateTeam(id: string, data: Prisma.TeamUpdateInput) {
  return prisma.team.update({
    where: { id },
    data,
  });
}

export function deleteTeam(id: string) {
  return prisma.team.delete({
    where: { id },
  });
}
