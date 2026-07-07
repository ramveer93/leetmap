import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ArrowUpRight, Building2, Loader2, Search, X, Link as LinkIcon, Plus, Check, ChevronsUpDown } from "lucide-react";
import { AppFooter, AppHeader } from "@/components/app-chrome";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";

const API_BASE = "http://localhost:5001/api";

export const Route = createFileRoute("/")({
  component: Index,
});

type Difficulty = "Easy" | "Medium" | "Hard";
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

type CompanyFreq = {
  "30_days": number;
  "3_months": number;
  "6_months": number;
  "more_than_6_months": number;
  "all": number;
};

type Problem = {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  url: string;
  topics: string[];
  companies: Record<string, CompanyFreq>;
  searched_company?: string;
};

function CompanyAvatar({ name, i }: { name: string; i: number }) {
  const hue = avatarHues[i % avatarHues.length];
  return (
    <div
      title={name}
      className={`grid size-7 place-items-center rounded-full bg-gradient-to-br ${hue} font-mono text-[10px] font-semibold text-foreground ring-2 ring-surface`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function ProblemCard({ p, selectedCompany, onClick }: { p: Problem; selectedCompany: string; onClick: () => void }) {
  const visibleCompanies = Object.keys(p.companies || {});
  const visible = visibleCompanies.slice(0, 2);
  const extra = visibleCompanies.length - visible.length;
  const numId = parseInt(p.id) || 0;

  return (
    <article 
      onClick={onClick}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface p-5 ring-1 ring-hairline transition-all hover:-translate-y-0.5 hover:ring-brand/40 hover:shadow-[0_20px_60px_-30px_var(--brand)] cursor-pointer"
    >
      <span className={`absolute inset-x-0 top-0 h-[3px] ${diffAccent[p.difficulty] || 'bg-brand'}`} />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">
            #{p.id ? p.id.toString().padStart(4, "0") : "N/A"}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${diffChipBg[p.difficulty] || 'bg-brand/10'} ${diffText[p.difficulty] || 'text-brand'}`}
          >
            {p.difficulty}
          </span>
        </div>
        <h2 className="text-lg font-medium leading-tight text-foreground">{p.title}</h2>
        <div className="flex flex-wrap gap-1.5">
          {p.topics && p.topics.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded bg-surface-elevated px-2 py-0.5 text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
          {p.topics && p.topics.length > 3 && (
            <span className="rounded bg-surface-elevated px-2 py-0.5 text-xs text-muted-foreground">
              +{p.topics.length - 3}
            </span>
          )}
        </div>
      </div>
      <div className="mt-8 flex items-end justify-between border-t border-hairline/60 pt-4">
        <div className="flex items-center gap-3">
          {selectedCompany !== "All" && p.companies[selectedCompany] ? (
            <span className="text-xs font-semibold text-brand">
              🔥 {selectedCompany}: {p.companies[selectedCompany].all}%
            </span>
          ) : p.searched_company && p.companies[p.searched_company] ? (
            <span className="text-xs font-semibold text-brand">
              🔥 {p.searched_company}: {p.companies[p.searched_company].all}%
            </span>
          ) : (
            <>
              <div className="flex -space-x-2">
                {visible.map((c, i) => (
                  <CompanyAvatar key={c} name={c} i={i + numId} />
                ))}
                {extra > 0 && (
                  <div className="grid size-7 place-items-center rounded-full bg-surface-elevated text-[10px] font-medium text-muted-foreground ring-2 ring-surface">
                    +{extra}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {visibleCompanies.length} {visibleCompanies.length === 1 ? 'company' : 'companies'}
              </span>
            </>
          )}
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
  const [problems, setProblems] = useState<Problem[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("All");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalProblems, setTotalProblems] = useState(0);
  const [companyOpen, setCompanyOpen] = useState(false);
  
  // Company Form State
  const [companyForm, setCompanyForm] = useState({
    company_name: "",
    "30_days": 0,
    "3_months": 0,
    "6_months": 0,
    "more_than_6_months": 0,
    "all": 100,
  });
  const [companyFormMessage, setCompanyFormMessage] = useState("");

  // Fetch initial companies list on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, selectedCompany, difficulty, limit]);

  // Fetch problems on search, page, or filter change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProblems();
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query, selectedCompany, difficulty, page, limit]);

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_BASE}/companies`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    }
  };

  const fetchProblems = async () => {
    try {
      let url = `${API_BASE}/problems?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      if (selectedCompany && selectedCompany !== "All") {
        url = `${API_BASE}/problems?company=${encodeURIComponent(selectedCompany)}&q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      }
      if (difficulty) {
        url += `&difficulty=${encodeURIComponent(difficulty)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProblems(data);
        const totalHeader = res.headers.get("x-total-count");
        if (totalHeader) {
          setTotalProblems(parseInt(totalHeader, 10));
        } else {
          setTotalProblems(data.length);
        }
      }
    } catch (err) {
      console.error("Failed to fetch problems:", err);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/parser/run`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(`Database refreshed! Loaded ${data.count} unique questions.`);
        fetchCompanies();
        fetchProblems();
      } else {
        alert("Failed to refresh database.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend.");
    } finally {
      setSyncing(false);
    }
  };

  const handleAddCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyName = companyForm.company_name.trim();
    if (!companyName || !selectedProblem) {
      setCompanyFormMessage("Company name is required.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/problems/${selectedProblem.slug}/company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          "30_days": parseFloat((companyForm["30_days"] || 0).toString()),
          "3_months": parseFloat((companyForm["3_months"] || 0).toString()),
          "6_months": parseFloat((companyForm["6_months"] || 0).toString()),
          "more_than_6_months": parseFloat((companyForm["more_than_6_months"] || 0).toString()),
          "all": parseFloat((companyForm["all"] || 0).toString())
        })
      });

      if (res.ok) {
        const updatedProblem = await res.json();
        setSelectedProblem(updatedProblem);
        setProblems(problems.map((p) => (p.slug === updatedProblem.slug ? updatedProblem : p)));
        setCompanyFormMessage("Company added successfully!");
        fetchCompanies();
        setCompanyForm({
          company_name: "",
          "30_days": 0,
          "3_months": 0,
          "6_months": 0,
          "more_than_6_months": 0,
          "all": 100
        });
        setTimeout(() => {
          setIsAddingCompany(false);
          setCompanyFormMessage("");
        }, 1500);
      } else {
        const data = await res.json();
        setCompanyFormMessage(data.error || "Failed to add company.");
      }
    } catch (err) {
      setCompanyFormMessage("Error communicating with backend.");
    }
  };

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      if (difficulty && p.difficulty !== difficulty) return false;
      return true;
    });
  }, [problems, difficulty]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
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
              placeholder="Search by problem title, ID or company name..."
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

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="flex w-full flex-col gap-6 lg:w-64 lg:shrink-0 lg:sticky lg:top-20 lg:self-start">
            {/* Company Filter Searchable Dropdown */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Filter by Company
              </h3>
              <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={companyOpen}
                    className="w-full justify-between bg-surface text-foreground hover:bg-surface-elevated border-hairline font-normal h-10 px-3 rounded-lg"
                  >
                    <span className="truncate">
                      {selectedCompany === "All" ? "All Companies" : selectedCompany}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 bg-surface border border-hairline z-50">
                  <Command className="bg-surface text-foreground">
                    <CommandInput placeholder="Search company..." className="h-9 text-foreground bg-transparent border-b border-hairline" />
                    <CommandList className="max-h-60 overflow-y-auto">
                      <CommandEmpty>No company found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All"
                          onSelect={() => {
                            setSelectedCompany("All");
                            setCompanyOpen(false);
                          }}
                          className="cursor-pointer text-foreground hover:bg-surface-elevated flex items-center justify-between"
                        >
                          <span>All Companies</span>
                          {selectedCompany === "All" && <Check className="h-4 w-4 text-brand" />}
                        </CommandItem>
                        {companies.map((c) => (
                          <CommandItem
                            key={c}
                            value={c}
                            onSelect={() => {
                              setSelectedCompany(c);
                              setCompanyOpen(false);
                            }}
                            className="cursor-pointer text-foreground hover:bg-surface-elevated flex items-center justify-between"
                          >
                            <span>{c}</span>
                            {selectedCompany === c && <Check className="h-4 w-4 text-brand" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </section>

            {/* Difficulty Filter */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Difficulty
              </h3>
              <div className="flex flex-col gap-1.5">
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

            {/* Sync Database */}
            <div className="mt-2 flex flex-col gap-3 rounded-xl bg-surface/60 p-4 ring-1 ring-hairline">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Sync your local <code className="font-mono text-foreground">data-sources/</code>{" "}
                repo to rebuild the compiled JSON index.
              </p>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground ring-offset-2 ring-offset-background transition-transform active:scale-[0.98] disabled:opacity-70 cursor-pointer"
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
                    setSelectedCompany("All");
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
                  <ProblemCard 
                    key={p.slug} 
                    p={p} 
                    selectedCompany={selectedCompany} 
                    onClick={() => {
                      setSelectedProblem(p);
                      setIsAddingCompany(false);
                      setCompanyFormMessage("");
                    }} 
                  />
                ))}
              </div>
            )}

            {/* Bottom Pagination Controls */}
            {filtered.length > 0 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-6 sm:flex-row">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Show</span>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                    className="h-8 rounded bg-surface px-2 text-xs text-foreground outline-none ring-1 ring-hairline border-none cursor-pointer"
                  >
                    {[10, 25, 50, 100, 150].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span>per page</span>
                  <span className="ml-4">
                    Showing {Math.min((page - 1) * limit + 1, totalProblems)} - {Math.min(page * limit, totalProblems)} of {totalProblems}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="bg-surface text-foreground hover:bg-surface-elevated border-hairline disabled:opacity-40 h-8"
                  >
                    Previous
                  </Button>
                  <div className="text-xs text-muted-foreground px-1">
                    Page {page} of {Math.max(1, Math.ceil(totalProblems / limit))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(totalProblems / limit)}
                    onClick={() => setPage((p) => p + 1)}
                    className="bg-surface text-foreground hover:bg-surface-elevated border-hairline disabled:opacity-40 h-8"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <AppFooter count={totalProblems} />

      {/* Problem Detail Modal */}
      {selectedProblem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedProblem(null)}
        >
          <div 
            className="bg-surface border border-hairline rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto relative shadow-2xl flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 hover:bg-surface-elevated rounded-lg transition-colors"
              onClick={() => setSelectedProblem(null)}
            >
              <X className="size-5" />
            </button>

            {/* Header info */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">ID: #{selectedProblem.id || "N/A"}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${diffChipBg[selectedProblem.difficulty] || 'bg-brand/10'} ${diffText[selectedProblem.difficulty] || 'text-brand'}`}>
                  {selectedProblem.difficulty}
                </span>
              </div>
              <h2 className="text-2xl font-semibold text-foreground leading-tight">{selectedProblem.title}</h2>
              {selectedProblem.url && (
                <a 
                  href={selectedProblem.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-brand font-medium hover:underline inline-flex items-center gap-1 mt-1"
                >
                  Open on LeetCode <LinkIcon className="size-3.5" />
                </a>
              )}
            </div>

            {/* Topics */}
            {selectedProblem.topics && selectedProblem.topics.length > 0 && (
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Topics</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProblem.topics.map((t) => (
                    <span key={t} className="rounded bg-surface-elevated px-2 py-0.5 text-xs text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Frequencies table */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company demographics</h4>
                <button
                  onClick={() => setIsAddingCompany(!isAddingCompany)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
                >
                  {isAddingCompany ? "Cancel" : "+ Add Company Info"}
                </button>
              </div>

              {/* Add company form */}
              {isAddingCompany && (
                <form 
                  onSubmit={handleAddCompanySubmit}
                  className="flex flex-col gap-4 rounded-xl bg-surface-elevated/40 p-4 ring-1 ring-hairline"
                >
                  <h5 className="text-sm font-semibold text-foreground">Log company frequency</h5>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Company Name *</span>
                    <input
                      type="text"
                      placeholder="e.g. Netflix"
                      value={companyForm.company_name}
                      onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                      className="h-10 rounded-lg bg-background px-3 text-sm outline-none ring-1 ring-hairline focus:ring-2 focus:ring-brand/60"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted-foreground">30 Days Freq (%)</span>
                      <input
                        type="number" min="0" max="100" step="0.1"
                        value={companyForm["30_days"]}
                        onChange={(e) => setCompanyForm({ ...companyForm, "30_days": parseFloat(e.target.value || "0") })}
                        className="h-10 rounded-lg bg-background px-3 text-sm outline-none ring-1 ring-hairline"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted-foreground">3 Months Freq (%)</span>
                      <input
                        type="number" min="0" max="100" step="0.1"
                        value={companyForm["3_months"]}
                        onChange={(e) => setCompanyForm({ ...companyForm, "3_months": parseFloat(e.target.value || "0") })}
                        className="h-10 rounded-lg bg-background px-3 text-sm outline-none ring-1 ring-hairline"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted-foreground">6 Months Freq (%)</span>
                      <input
                        type="number" min="0" max="100" step="0.1"
                        value={companyForm["6_months"]}
                        onChange={(e) => setCompanyForm({ ...companyForm, "6_months": parseFloat(e.target.value || "0") })}
                        className="h-10 rounded-lg bg-background px-3 text-sm outline-none ring-1 ring-hairline"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted-foreground">All-Time Freq (%)</span>
                      <input
                        type="number" min="0" max="100" step="0.1"
                        value={companyForm["all"]}
                        onChange={(e) => setCompanyForm({ ...companyForm, "all": parseFloat(e.target.value || "0") })}
                        className="h-10 rounded-lg bg-background px-3 text-sm outline-none ring-1 ring-hairline"
                      />
                    </label>
                  </div>

                  {companyFormMessage && (
                    <p className={`text-xs font-semibold ${companyFormMessage.includes("success") ? "text-easy" : "text-hard"}`}>
                      {companyFormMessage}
                    </p>
                  )}

                  <button 
                    type="submit"
                    className="inline-flex justify-center rounded-lg bg-brand py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 transition-colors"
                  >
                    Save company frequency
                  </button>
                </form>
              )}

              {/* Table */}
              {selectedProblem.companies && Object.keys(selectedProblem.companies).length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-hairline/60 bg-surface-elevated/20">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-hairline/60 bg-surface-elevated/40 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <th className="p-3">Company</th>
                        <th className="p-3">30 Days</th>
                        <th className="p-3">3 Months</th>
                        <th className="p-3">6 Months</th>
                        <th className="p-3">All Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline/40">
                      {Object.entries(selectedProblem.companies).map(([compName, pFreq]) => (
                        <tr key={compName} className="hover:bg-surface-elevated/10">
                          <td className="p-3 font-medium text-foreground">{compName}</td>
                          <td className="p-3">
                            <div className="text-xs">{pFreq["30_days"]}%</div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-background overflow-hidden">
                              <div className="h-full bg-hard rounded-full" style={{ width: `${pFreq["30_days"]}%` }}></div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs">{pFreq["3_months"]}%</div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-background overflow-hidden">
                              <div className="h-full bg-medium rounded-full" style={{ width: `${pFreq["3_months"]}%` }}></div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs">{pFreq["6_months"]}%</div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-background overflow-hidden">
                              <div className="h-full bg-brand rounded-full" style={{ width: `${pFreq["6_months"]}%` }}></div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs">{pFreq["all"]}%</div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-background overflow-hidden">
                              <div className="h-full bg-easy rounded-full" style={{ width: `${pFreq["all"]}%` }}></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-hairline rounded-xl bg-surface-elevated/10">
                  No company demographics stored. Click "+ Add Company Info" above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
