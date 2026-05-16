import Image from "next/image"

const groupMatches = [
  {
    opponent: "NC Fusion Select",
    date: "May 22",
    time: "9:00 AM",
    field: "Bryan Park 03",
    score: "2-0",
    status: "Final",
  },
  {
    opponent: "Charlotte SA Blue",
    date: "May 22",
    time: "2:30 PM",
    field: "Bryan Park 05",
    score: "1-1",
    status: "Final",
  },
  {
    opponent: "Wake FC South",
    date: "May 23",
    time: "10:45 AM",
    field: "Truist 02",
    score: "Next",
    status: "Group",
  },
]

const bracketRounds = [
  {
    name: "Semifinal",
    matches: [
      {
        top: "Forest 2016G Black",
        bottom: "Group B Runner-up",
        meta: "May 24, 8:30 AM",
      },
      {
        top: "Group B Winner",
        bottom: "Group A Runner-up",
        meta: "May 24, 8:30 AM",
      },
    ],
  },
  {
    name: "Final",
    matches: [
      {
        top: "Semifinal Winner",
        bottom: "Semifinal Winner",
        meta: "May 24, 1:15 PM",
      },
    ],
  },
]

const standings = [
  { team: "Forest 2016G Black", played: 2, points: 4, diff: "+2" },
  { team: "Charlotte SA Blue", played: 2, points: 4, diff: "+1" },
  { team: "Wake FC South", played: 2, points: 3, diff: "0" },
  { team: "NC Fusion Select", played: 2, points: 0, diff: "-3" },
]

export default function Page() {
  return (
    <main className="min-h-svh bg-[#f6f8fb] text-[#102033]">
      <section className="relative overflow-hidden bg-[#082f49] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.22),transparent_28%),linear-gradient(135deg,rgba(8,47,73,0.98),rgba(12,74,110,0.86))]" />
        <div className="relative mx-auto grid min-h-[520px] max-w-7xl grid-cols-1 content-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_390px] lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-bold tracking-[0.24em] text-cyan-200 uppercase">
              NC Fusion Cup 2026
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl leading-[0.94] font-black sm:text-7xl">
              Forest 2016G Black
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-sky-50">
              Live tournament bracket, group standings, and match schedule for
              families following Forest through the NC Fusion Cup weekend.
            </p>
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              <Stat label="Group" value="A" />
              <Stat label="Points" value="4" />
              <Stat label="Goal Diff" value="+2" />
            </div>
          </div>
          <div className="flex items-center justify-center lg:justify-end">
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
          <Panel title="Tournament Bracket" eyebrow="Knockout path">
            <div className="grid gap-5 overflow-x-auto pb-2 md:grid-cols-2">
              {bracketRounds.map((round) => (
                <div key={round.name} className="min-w-72">
                  <h3 className="mb-3 text-sm font-bold tracking-[0.18em] text-slate-500 uppercase">
                    {round.name}
                  </h3>
                  <div className="space-y-4">
                    {round.matches.map((match) => (
                      <div
                        key={`${match.top}-${match.bottom}`}
                        className="rounded-lg border border-slate-200 bg-white shadow-sm"
                      >
                        <TeamSlot
                          team={match.top}
                          featured={match.top === "Forest 2016G Black"}
                        />
                        <TeamSlot team={match.bottom} />
                        <div className="border-t border-slate-100 px-4 py-2 text-xs font-medium text-slate-500">
                          {match.meta}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Group Schedule" eyebrow="Forest matches">
            <div className="grid gap-3">
              {groupMatches.map((match) => (
                <article
                  key={match.opponent}
                  className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[120px_1fr_auto]"
                >
                  <div>
                    <div className="font-black text-slate-900">
                      {match.date}
                    </div>
                    <div className="text-sm font-medium text-slate-500">
                      {match.time}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-[0.14em] text-cyan-700 uppercase">
                      Forest 2016G Black
                    </div>
                    <div className="mt-1 text-lg font-bold text-slate-900">
                      vs {match.opponent}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {match.field}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                      {match.status}
                    </span>
                    <span className="text-2xl font-black text-slate-950">
                      {match.score}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Group Standings" eyebrow="Updated by scraper">
            <div className="space-y-2">
              {standings.map((row, index) => (
                <div
                  key={row.team}
                  className="grid grid-cols-[28px_1fr_40px_44px] items-center gap-2 rounded-md bg-slate-50 px-3 py-3 text-sm"
                >
                  <span className="font-black text-slate-400">{index + 1}</span>
                  <span
                    className={
                      row.team === "Forest 2016G Black"
                        ? "font-black"
                        : "font-semibold"
                    }
                  >
                    {row.team}
                  </span>
                  <span className="text-right font-bold text-slate-600">
                    {row.points} pts
                  </span>
                  <span className="text-right font-bold text-cyan-700">
                    {row.diff}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Data Sync" eyebrow="Trigger.dev cron">
            <div className="space-y-4 text-sm leading-6 text-slate-600">
              <p>
                The tournament feed is designed to refresh every 30 minutes from
                the NC Fusion Cup site through the scheduled Trigger.dev task.
              </p>
              <div className="rounded-lg bg-[#082f49] p-4 font-mono text-xs leading-6 text-cyan-50">
                task: sync-nc-fusion-cup
                <br />
                cron: */30 * * * *
                <br />
                team: Forest 2016G Black
              </div>
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-4">
      <div className="text-xs font-bold tracking-[0.18em] text-cyan-100 uppercase">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black">{value}</div>
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

function TeamSlot({
  team,
  featured = false,
}: {
  team: string
  featured?: boolean
}) {
  return (
    <div
      className={
        featured
          ? "flex items-center justify-between bg-cyan-50 px-4 py-3 font-black text-cyan-900"
          : "flex items-center justify-between px-4 py-3 font-semibold text-slate-700"
      }
    >
      <span>{team}</span>
      <span className="h-2.5 w-2.5 rounded-full bg-current opacity-40" />
    </div>
  )
}
