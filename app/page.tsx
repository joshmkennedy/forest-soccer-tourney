import { MatchStage } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"

const FEATURED_TEAM = "Forest 2016G Black"

export const dynamic = "force-dynamic"

type TournamentPageData = NonNullable<Awaited<ReturnType<typeof getTournamentPageData>>>
type TeamRow = TournamentPageData["teams"][number]
type StandingTeamRow = TournamentPageData["groups"][number]["teams"][number] | TeamRow
type MatchRow = TournamentPageData["matches"][number]

async function getTournamentPageData() {
  return prisma.tournament.findFirst({
    where: { name: "NC Fusion Cup" },
    include: {
      groups: {
        include: {
          teams: {
            include: {
              stats: true,
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
      teams: {
        include: {
          group: true,
          stats: true,
        },
        orderBy: { name: "asc" },
      },
      matches: {
        include: {
          home: true,
          away: true,
          winner: true,
        },
        orderBy: { date: "asc" },
      },
    },
    orderBy: [{ season: "desc" }, { createdAt: "desc" }],
  })
}

export default async function Page() {
  const tournament = await getTournamentPageData()

  if (!tournament) {
    return <EmptyState />
  }

  const forest = tournament.teams.find((team) => team.name === FEATURED_TEAM)
  const forestGroup = forest?.group?.name ?? "TBD"
  const forestStats = forest?.stats
  const forestGroupStandings = getStandings(tournament.teams, forest?.groupId)
  const standingPosition = forestGroupStandings.findIndex((team) => team.id === forest?.id) + 1
  const groupedStandings = getGroupedStandings(tournament.groups)
  const combinedStandings = getStandings(tournament.teams)
  const shouldUseCombinedStandings = hasAdvancedPastGroupStage(tournament.matches)
  const groupMatches = getFeaturedTeamMatches(tournament.matches, forest?.id)
  const advancementMatches = getAdvancementMatches(tournament.matches)
  const nextMatch = getNextMatch(groupMatches)
  const nextSyncTime = getNextSyncTime()

  return (
    <main className="min-h-svh bg-[#f6f8fb] text-[#102033]">
      <section className="relative overflow-hidden bg-[#082f49] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.22),transparent_28%),linear-gradient(135deg,rgba(8,47,73,0.98),rgba(12,74,110,0.86))]" />
        <div className="relative mx-auto grid min-h-[520px] max-w-7xl grid-cols-1 content-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_390px] lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-bold tracking-[0.24em] text-cyan-200 uppercase">
              {tournament.name} {tournament.season}
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl leading-[0.94] font-black sm:text-7xl">
              {FEATURED_TEAM}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-sky-50">
              Live tournament bracket, group standings, and match schedule for
              families following Forest through the NC Fusion Cup weekend.
            </p>
            <div className="mt-8 grid max-w-3xl gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
              <NextMatchCard match={nextMatch} teamId={forest?.id} />
              <StandingCard
                group={forestGroup}
                standing={standingPosition || undefined}
                points={forestStats?.points ?? 0}
                goalDifference={forestStats?.goalDifference ?? 0}
              />
            </div>
            {forest ? (
              <Link
                href={`/teams/${forest.id}`}
                className="mt-5 inline-flex rounded-lg bg-white px-6 py-3 text-sm font-black tracking-[0.12em] text-[#082f49] uppercase shadow-lg transition hover:bg-cyan-50"
              >
                View Forest Team Page
              </Link>
            ) : null}
          </div>
          <div className="row-start-1 flex items-center justify-center lg:row-start-auto lg:justify-end">
            <div className="aspect-[16/10] w-full max-w-sm rounded-lg border border-white/15 bg-white/95 p-6 shadow-2xl">
              <Image
                src="/fusion-cup-logo.svg"
                alt="Fusion Cup 2026 logo"
                width={640}
                height={260}
                priority
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_360px] lg:px-10">
        <div className="space-y-6">
          <Panel title="Group Schedule" eyebrow="Forest matches">
            <div className="grid gap-3">
              {groupMatches.map((match) => {
                return (
                  <ScheduleCard
                    key={match.id}
                    match={match}
                    label={FEATURED_TEAM}
                    teamId={forest?.id}
                  />
                )
              })}
              {advancementMatches.map((match) => (
                <ScheduleCard
                  key={match.id}
                  match={match}
                  label={match.stage}
                  matchup={getAdvancementMatchup(match)}
                />
              ))}
            </div>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Group Standings" eyebrow="Updated by scraper">
            <div className="space-y-5">
              {shouldUseCombinedStandings ? (
                <div>
                  <h3 className="mb-2 text-sm font-black tracking-[0.16em] text-slate-500 uppercase">
                    Overall
                  </h3>
                  <StandingsRows teams={combinedStandings} />
                </div>
              ) : (
                groupedStandings.map((group) => (
                  <div key={group.id}>
                    <h3 className="mb-2 text-sm font-black tracking-[0.16em] text-slate-500 uppercase">
                      {group.name}
                    </h3>
                    <StandingsRows teams={group.teams} />
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Data Sync" eyebrow="Automatic refresh">
            <div className="space-y-4 text-sm leading-6 text-slate-600">
              <p>
                The tournament feed refreshes every 30 minutes from the NC
                Fusion Cup site through the scheduled Trigger.dev task.
              </p>
              <div className="rounded-lg bg-[#082f49] p-4 text-cyan-50">
                <div className="text-xs font-black tracking-[0.18em] text-cyan-200 uppercase">
                  Next Update
                </div>
                <div className="mt-2 text-3xl font-black md:text-2xl lg:text-3xl">
                  {formatTime(nextSyncTime)}
                </div>
                <div className="mt-1 text-sm text-cyan-100">
                  {formatDate(nextSyncTime)} · {tournament.matches.length} matches tracked
                </div>
              </div>
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  )
}

function EmptyState() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#f6f8fb] px-6 text-[#102033]">
      <div className="max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold tracking-[0.2em] text-cyan-700 uppercase">
          NC Fusion Cup
        </p>
        <h1 className="mt-2 text-3xl font-black">No tournament data yet</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Run <span className="font-mono">bun run db:seed</span> with{" "}
          <span className="font-mono">NC_FUSION_CUP_URL</span> configured to
          load the schedule, groups, standings, and bracket.
        </p>
      </div>
    </main>
  )
}

function getStandings<T extends StandingTeamRow>(teams: T[], groupId?: string | null) {
  return teams
    .filter((team) => !groupId || team.groupId === groupId)
    .sort((a, b) => {
      const aStats = a.stats
      const bStats = b.stats

      return (
        (bStats?.points ?? 0) - (aStats?.points ?? 0) ||
        (bStats?.goalDifference ?? 0) - (aStats?.goalDifference ?? 0) ||
        (bStats?.goalsFor ?? 0) - (aStats?.goalsFor ?? 0) ||
        a.name.localeCompare(b.name)
      )
    })
}

function getGroupedStandings(groups: TournamentPageData["groups"]) {
  return groups.map((group) => ({
    ...group,
    teams: getStandings(group.teams),
  }))
}

function hasAdvancedPastGroupStage(matches: MatchRow[]) {
  return matches.some(
    (match) =>
      match.stage !== MatchStage.Group &&
      (match.homeTeamId ||
        match.awayTeamId ||
        match.winnerTeamId ||
        hasScore(match))
  )
}

function StandingsRows({ teams }: { teams: StandingTeamRow[] }) {
  return (
    <div className="space-y-2">
      {teams.map((row, index) => (
        <div
          key={row.id}
          className="grid grid-cols-[28px_1fr_40px_44px] items-center gap-2 rounded-md bg-slate-50 px-3 py-3 text-sm"
        >
          <span className="font-black text-slate-400">{index + 1}</span>
          <Link
            href={`/teams/${row.id}`}
            className={row.name === FEATURED_TEAM ? "font-black" : "font-semibold"}
          >
            {row.name}
          </Link>
          <span className="text-right font-bold text-slate-600">
            {row.stats?.points ?? 0} pts
          </span>
          <span className="text-right font-bold text-cyan-700">
            {formatDiff(row.stats?.goalDifference ?? 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

function getFeaturedTeamMatches(matches: MatchRow[], teamId?: string) {
  if (!teamId) {
    return []
  }

  return matches.filter(
    (match) =>
      match.stage === MatchStage.Group &&
      (match.homeTeamId === teamId || match.awayTeamId === teamId)
  )
}

function getAdvancementMatches(matches: MatchRow[]) {
  return matches.filter(
    (match) =>
      match.stage === MatchStage.Consolation || match.stage === MatchStage.Final
  )
}

function getNextMatch(matches: MatchRow[]) {
  const now = new Date()

  return (
    matches.find(
      (match) =>
        match.date >= now && (match.homeScore === null || match.awayScore === null)
    ) ??
    matches.find((match) => match.homeScore === null || match.awayScore === null) ??
    matches.at(-1)
  )
}

function getNextSyncTime(now = new Date()) {
  const next = new Date(now)
  const minutes = next.getMinutes()
  const nextMinute = minutes < 30 ? 30 : 60

  next.setMinutes(nextMinute, 0, 0)

  return next
}

function getOpponentName(match: MatchRow, teamId?: string) {
  return getOpponent(match, teamId)?.name ?? "Opponent TBD"
}

function getOpponent(match: MatchRow, teamId?: string) {
  if (match.homeTeamId === teamId) {
    return match.away
  }

  return match.home
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

function getAdvancementMatchup(match: MatchRow) {
  if (match.home || match.away) {
    return (
      <>
        <TeamLink team={match.home} fallback="TBD" />
        <span> vs </span>
        <TeamLink team={match.away} fallback="TBD" />
      </>
    )
  }

  return "TBD"
}

function ScheduleCard({
  match,
  label,
  matchup,
  teamId,
}: {
  match: MatchRow
  label: string
  matchup?: React.ReactNode
  teamId?: string
}) {
  return (
    <article className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[120px_1fr_auto]">
      <div>
        <div className="font-black text-slate-900">
          {formatDate(match.date)}
        </div>
        <div className="text-sm font-medium text-slate-500">
          {formatTime(match.date)}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold tracking-[0.14em] text-cyan-700 uppercase">
          {label}
        </div>
        {match.home || match.away ? (
          <div className="mt-2 space-y-2 text-lg font-bold text-slate-900">
            <TeamLine team={match.home} featured={match.homeTeamId === teamId} side="Home" />
            <TeamLine team={match.away} featured={match.awayTeamId === teamId} side="Away" />
          </div>
        ) : (
          <div className="mt-1 text-lg font-bold text-slate-900">
            {matchup}
          </div>
        )}
        <div className="mt-1 text-sm text-slate-500">
          {match.field ?? "Field TBD"}
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
      <TeamLink team={team} featured={featured} />
    </div>
  )
}

function NextMatchCard({
  match,
  teamId,
}: {
  match?: MatchRow
  teamId?: string
}) {
  const isHome = match?.homeTeamId === teamId
  const opponent = match ? getOpponentName(match, teamId) : "TBD"

  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-4">
      <div className="text-xs font-bold tracking-[0.18em] text-cyan-100 uppercase">
        Next Match
      </div>
      <div className="mt-3 text-2xl font-black">
        {match ? formatDate(match.date) : "TBD"}
      </div>
      <div className="mt-1 text-sm font-bold text-cyan-100">
        {match ? formatTime(match.date) : "Time TBD"}
      </div>
      <div className="mt-4 text-sm leading-5 text-sky-50">
        <span className="font-black">{isHome ? "Home" : "Away"}</span>
        <span className="text-cyan-100"> vs </span>
        <span>{opponent}</span>
      </div>
    </div>
  )
}

function TeamLink({
  team,
  fallback = "Opponent TBD",
  prefix = "",
  featured = false,
}: {
  team?: { id: string; name: string } | null
  fallback?: string
  prefix?: string
  featured?: boolean
}) {
  if (!team) {
    return (
      <span>
        {prefix}
        {fallback}
      </span>
    )
  }

  return (
    <Link
      href={`/teams/${team.id}`}
      className={featured ? "text-cyan-700 hover:underline" : "hover:text-cyan-700 hover:underline"}
    >
      {prefix}
      {team.name}
    </Link>
  )
}

function StandingCard({
  group,
  standing,
  points,
  goalDifference,
}: {
  group: string
  standing?: number
  points: number
  goalDifference: number
}) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-4">
      <div className="text-xs font-bold tracking-[0.18em] text-cyan-100 uppercase">
        Current Standing
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <div className="text-4xl font-black">
            {standing ? `#${standing}` : "TBD"}
          </div>
          <div className="mt-1 text-sm font-bold text-cyan-100">
            {group}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-cyan-100">Points</div>
            <div className="text-2xl font-black">{points}</div>
          </div>
          <div>
            <div className="text-cyan-100">Goal Diff</div>
            <div className="text-2xl font-black">
              {formatDiff(goalDifference)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
