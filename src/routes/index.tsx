import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, Building2, Loader2, Search, X } from "lucide-react";
import { AppFooter, AppHeader } from "@/components/app-chrome";
import { PROBLEMS, type Difficulty, type Problem } from "@/lib/problems";

export const Route = createFileRoute("/")({
  component: Index,
});

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

const diffAccent: Record<Difficulty, string> = {
  Easy: "bg-easy",
  Medium: "bg-medium",
  Hard: "bg-hard",
};
const diffText: Record<Difficulty, string> = {
  Easy: "text-easy",
  Medium: "text-medium",
  Hard: "text-hard",
};
const diffChipBg: Record<Difficulty, string> = {
  Easy: "bg-easy/10",
  Medium: "bg-medium/10",
  Hard: "bg-hard/10",
};
const avatarHues = [
  "from-sky-500/40 to-sky-500/10",
  "from-rose-500/40 to-rose-500/10",
  "from-amber-500/40 to-amber-500/10",
  "from-emerald-500/40 to-emerald-500/10",
  "from-violet-500/40 to-violet-500/10",
  "from-cyan-500/40 to-cyan-500/10",
];

function CompanyAvatar({ name, i }: { name: string; i: number }) {
  const hue = avatarHues[i % avatarHues.length];
  return (
    <div
      title={name}
      className={`grid size-7 place-items-center rounded-full bg-gradient-to-br ${hue} font-mono text-[10px] font-semibold text-foreground ring-2 ring-surface`}
    >
      {name.slice(0, 1)}
    </div>
  );
}

function ProblemCard({ p }: { p: Problem }) {
  const visible = p.companies.slice(0, 2);
  const extra = p.companies.length - visible.length;
  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface p-5 ring-1 ring-hairline transition-all hover:-translate-y-0.5 hover:ring-brand/40 hover:shadow-[0_20px_60px_-30px_var(--brand)]">
      <span className={`absolute inset-x-0 top-0 h-[3px] ${diffAccent[p.difficulty]}`} />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">
            #{p.id.toString().padStart(4, "0")}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${diffChipBg[p.difficulty]} ${diffText[p.difficulty]}`}
          >
            {p.difficulty}
          </span>
        </div>
        <h2 className="text-lg font-medium leading-tight text-foreground">{p.title}</h2>
        <div className="flex flex-wrap gap-1.5">
          {p.tags.map((t) => (
            <span
              key={t}
              className="rounded bg-surface-elevated px-2 py-0.5 text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-8 flex items-end justify-between border-t border-hairline/60 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {visible.map((c, i) => (
              <CompanyAvatar key={c} name={c} i={i + p.id} />
            ))}
            {extra > 0 && (
              <div className="grid size-7 place-items-center rounded-full bg-surface-elevated text-[10px] font-medium text-muted-foreground ring-2 ring-surface">
                +{extra}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {p.companies.length} companies
          </span>
        </div>
        <button className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition-transform group-hover:translate-x-0.5">
          Details <ArrowUpRight className="size-3.5" />
        </button>
      </div>
    </article>
  );
}

function Index() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [syncing, setSyncing] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROBLEMS.filter((p) => {
      if (difficulty && p.difficulty !== difficulty) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.includes(q) ||
        p.id.toString() === q ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.companies.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [query, difficulty]);

  const handleSync = () => {
    setSyncing(true);
    window.setTimeout(() => setSyncing(false), 1400);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader active="problems" />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 pb-20">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
              Explore interview curations
            </h1>
            <p className="max-w-[60ch] text-pretty text-muted-foreground">
              Targeted practice based on real technical interview data from top-tier
              engineering teams. Search by problem, tag, or company.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search by problem, tag, or company…"
              className="h-12 w-full rounded-xl border-none bg-surface pl-12 pr-12 text-base text-foreground outline-none ring-1 ring-hairline transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/60"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </header>

        <div className="flex gap-8">
          <aside className="hidden w-64 shrink-0 flex-col gap-8 lg:flex">
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Difficulty
              </h3>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setDifficulty(null)}
                  className="flex items-center gap-3 rounded-md py-1.5 text-left text-sm text-muted-foreground hover:text-foreground"
                >
                  <span
                    className={`size-3 rounded-full border ${difficulty === null ? "border-brand bg-brand ring-4 ring-brand-soft" : "border-hairline bg-surface"}`}
                  />
                  All
                </button>
                {DIFFICULTIES.map((d) => {
                  const active = difficulty === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex items-center gap-3 rounded-md py-1.5 text-left text-sm ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <span
                        className={`size-3 rounded-full ${active ? `${diffAccent[d]} ring-4 ring-brand-soft` : "border border-hairline bg-surface"}`}
                      />
                      {d}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </h3>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-hairline hover:text-foreground">
                  Solved
                </button>
                <button className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-hairline hover:text-foreground">
                  Attempted
                </button>
                <button className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand ring-1 ring-brand/20">
                  Todo
                </button>
              </div>
            </section>

            <div className="mt-2 flex flex-col gap-3 rounded-xl bg-surface/60 p-4 ring-1 ring-hairline">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Sync your local <code className="font-mono text-foreground">data-sources/</code>{" "}
                repo to rebuild the compiled JSON index.
              </p>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground ring-offset-2 ring-offset-background transition-transform active:scale-[0.98] disabled:opacity-70"
              >
                {syncing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Syncing…
                  </>
                ) : (
                  <>
                    <Building2 className="size-4" />
                    Sync repositories
                  </>
                )}
              </button>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">{filtered.length}</span>{" "}
                problem{filtered.length === 1 ? "" : "s"}
                {difficulty && (
                  <>
                    {" "}
                    tagged{" "}
                    <span className={`font-medium ${diffText[difficulty]}`}>
                      {difficulty}
                    </span>
                  </>
                )}
              </span>
              <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                sorted by frequency
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-surface/20 text-center">
                <p className="text-sm text-foreground">No problems match your filters.</p>
                <button
                  onClick={() => {
                    setQuery("");
                    setDifficulty(null);
                  }}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => (
                  <ProblemCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <AppFooter count={PROBLEMS.length} />
    </div>
  );
}
