import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function createGroup(data: Prisma.GroupCreateInput) {
  return prisma.group.create({ data });
}

export function upsertGroup(data: {
  name: string;
  tournamentId: string;
}) {
  return prisma.group.upsert({
    where: {
      tournamentId_name: {
        tournamentId: data.tournamentId,
        name: data.name,
      },
    },
    create: data,
    update: {
      name: data.name,
    },
  });
}

export function listGroups(tournamentId: string) {
  return prisma.group.findMany({
    where: { tournamentId },
    include: {
      teams: {
        include: {
          stats: true,
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export function getGroup(id: string) {
  return prisma.group.findUnique({
    where: { id },
    include: {
      tournament: true,
      teams: {
        include: {
          stats: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });
}

export function updateGroup(id: string, data: Prisma.GroupUpdateInput) {
  return prisma.group.update({
    where: { id },
    data,
  });
}

export function deleteGroup(id: string) {
  return prisma.group.delete({
    where: { id },
  });
}
