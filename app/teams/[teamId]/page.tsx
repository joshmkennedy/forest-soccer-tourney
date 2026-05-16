import { prisma } from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

type TeamPageData = NonNullable<Awaited<ReturnType<typeof getTeamPageData>>>
type MatchRow = TeamPageData["homeMatches"][number] | TeamPageData["awayMatches"][number]

async function getTeamPageData(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      group: true,
      stats: true,
      tournament: true,
      homeMatches: {
        include: {
          home: true,
          away: true,
          winner: true,
        },
        orderBy: { date: "asc" },
      },
      awayMatches: {
        include: {
          home: true,
          away: true,
          winner: true,
        },
        orderBy: { date: "asc" },
      },
    },
  })
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const team = await getTeamPageData(teamId)

  if (!team) {
    notFound()
  }

  const matches = [...team.homeMatches, ...team.awayMatches].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )
  const playedMatches = matches.filter(
    (match) => match.homeScore !== null && match.awayScore !== null
  )
  const scheduleMatches = matches.filter(
    (match) => match.homeScore === null || match.awayScore === null
  )

  return (
    <main className="min-h-svh bg-[#f6f8fb] text-[#102033]">
      <section className="bg-[#082f49] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
          <Link href="/" className="text-sm font-bold text-cyan-100 hover:underline">
            Back to tournament
          </Link>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <TeamLogo team={team} size="large" />
            <div>
              <p className="text-sm font-bold tracking-[0.22em] text-cyan-200 uppercase">
                {team.tournament.name} {team.tournament.season}
              </p>
              <h1 className="mt-2 text-4xl font-black sm:text-6xl">{team.name}</h1>
              <p className="mt-3 text-lg text-sky-50">
                {team.association} · {team.group?.name ?? "Group TBD"}
              </p>
            </div>
          </div>
          <StatsGrid team={team} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:px-10">
        <Panel title="Schedule" eyebrow="Upcoming">
          <MatchList matches={scheduleMatches} teamId={team.id} empty="No upcoming matches." />
        </Panel>
        <Panel title="Matches Played" eyebrow="Results">
          <MatchList matches={playedMatches} teamId={team.id} empty="No scores posted yet." />
        </Panel>
      </section>
    </main>
  )
}

function StatsGrid({ team }: { team: TeamPageData }) {
  const stats = team.stats

  return (
    <div className="grid gap-3 sm:grid-cols-5 lg:max-w-5xl">
      <Stat label="Points" value={stats?.points ?? 0} />
      <Stat label="W-T-L" value={`${stats?.wins ?? 0}-${stats?.ties ?? 0}-${stats?.losses ?? 0}`} />
      <Stat label="Goals" value={`${stats?.goalsFor ?? 0}/${stats?.goalsAgainst ?? 0}`} />
      <Stat label="Goal Diff" value={formatDiff(stats?.goalDifference ?? 0)} />
      <Stat label="TB" value={stats?.tieBreaker ?? "-"} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-4">
      <div className="text-xs font-bold tracking-[0.18em] text-cyan-100 uppercase">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  )
}

function MatchList({
  matches,
  teamId,
  empty,
}: {
  matches: MatchRow[]
  teamId: string
  empty: string
}) {
  if (matches.length === 0) {
    return <p className="text-sm text-slate-500">{empty}</p>
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <article
          key={match.id}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[96px_1fr_auto]"
        >
          <div>
            <div className="font-black text-slate-900">{formatDate(match.date)}</div>
            <div className="text-sm font-medium text-slate-500">{formatTime(match.date)}</div>
          </div>
          <div>
            <div className="space-y-2 text-lg font-bold text-slate-950">
              <TeamLine team={match.home} featured={match.homeTeamId === teamId} side="Home" />
              <TeamLine team={match.away} featured={match.awayTeamId === teamId} side="Away" />
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {match.stage} · {match.field ?? "Field TBD"}
            </div>
          </div>
          <div className="flex items-center justify-end">
            {hasScore(match) ? (
              <span className="text-2xl font-black text-slate-950">
                {formatScore(match)}
              </span>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}

function TeamLine({
  team,
  featured,
  side,
}: {
  team: { id: string; name: string } | null
  featured?: boolean
  side: "Home" | "Away"
}) {
  const badge = (
    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600">
      {side}
    </span>
  )

  if (!team) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {badge}
        <span>TBD</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badge}
      <Link
        href={`/teams/${team.id}`}
        className={featured ? "text-cyan-700 hover:underline" : "hover:text-cyan-700 hover:underline"}
      >
        {team.name}
      </Link>
    </div>
  )
}

function TeamLogo({
  team,
  size = "small",
}: {
  team: { name: string; logoUrl: string | null }
  size?: "small" | "large"
}) {
  const className =
    size === "large"
      ? "h-24 w-24 rounded-lg border border-white/20 bg-white object-contain p-2"
      : "h-10 w-10 rounded-md border border-slate-200 bg-white object-contain p-1"

  if (!team.logoUrl) {
    return (
      <div className={`${className} grid place-items-center font-black text-[#082f49]`}>
        {team.name.slice(0, 1)}
      </div>
    )
  }

  const imageSize = size === "large" ? 96 : 40

  return (
    <Image
      src={team.logoUrl}
      alt={`${team.name} logo`}
      width={imageSize}
      height={imageSize}
      className={className}
      unoptimized
    />
  )
}

function formatScore(match: MatchRow) {
  return `${match.homeScore}-${match.awayScore}`
}

function hasScore(match: MatchRow) {
  return match.homeScore !== null && match.awayScore !== null
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(date)
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(date)
}

function formatDiff(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold tracking-[0.2em] text-cyan-700 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 mb-5 text-2xl font-black text-slate-950">{title}</h2>
      {children}
    </section>
  )
}
