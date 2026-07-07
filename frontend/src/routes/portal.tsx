import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { NotebookPen, Plus, Trash2, Search, X } from "lucide-react";
import { AppFooter, AppHeader } from "@/components/app-chrome";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Custom Questions Portal — LeetMap" },
      {
        name: "description",
        content:
          "Log your own interview questions and notes alongside the LeetCode index.",
      },
    ],
  }),
  component: Portal,
});

type Entry = {
  id: number;
  company: string;
  title: string;
  role?: string;
  difficulty: string;
  description: string;
  solution?: string;
  code_language?: string;
};

function Portal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company: "",
    title: "",
    role: "",
    difficulty: "Medium",
    description: "",
    solution: "",
    code_language: "python"
  });
  const [formMessage, setFormMessage] = useState("");

  // Fetch custom questions
  useEffect(() => {
    fetchEntries();
  }, [query]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/custom-problems?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error("Failed to fetch custom problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim() || !form.title.trim()) {
      setFormMessage("Title and Company are required.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/custom-problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          company: form.company.trim(),
          role: form.role.trim(),
          difficulty: form.difficulty,
          description: form.description.trim(),
          solution: form.solution.trim(),
          code_language: form.code_language
        })
      });

      if (res.ok) {
        setFormMessage("Custom question added successfully!");
        setForm({
          company: "",
          title: "",
          role: "",
          difficulty: "Medium",
          description: "",
          solution: "",
          code_language: "python"
        });
        fetchEntries();
        setTimeout(() => setFormMessage(""), 3000);
      } else {
        const data = await res.json();
        setFormMessage(data.error || "Failed to save question.");
      }
    } catch (err) {
      setFormMessage("Error communicating with backend.");
    }
  };

  const handleRemove = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/custom-problems/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setEntries(entries.filter((x) => x.id !== id));
      } else {
        alert("Failed to delete entry from backend.");
      }
    } catch (err) {
      console.error("Failed to delete custom problem:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <AppHeader active="portal" />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 pb-20">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brand">
              <NotebookPen className="size-3.5" /> Custom Portal
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight">
              Your interview log
            </h1>
            <p className="max-w-[60ch] text-pretty text-muted-foreground">
              Capture questions that never made it into any public list — the ones your friends
              got asked last week.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search custom questions by company, title, or details..."
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

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <section className="flex h-fit flex-col gap-4 rounded-2xl bg-surface p-6 ring-1 ring-hairline">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              New entry
            </h2>
            <form onSubmit={handleAddEntry} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Problem Title *</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Rate Limiter Design"
                  className="h-10 rounded-lg bg-background px-3 text-sm outline-none ring-1 ring-hairline focus:ring-2 focus:ring-brand/60"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Company *</span>
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. Stripe"
                    className="h-10 rounded-lg bg-background px-3 text-sm outline-none ring-1 ring-hairline focus:ring-2 focus:ring-brand/60"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Difficulty</span>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="h-10 rounded-lg bg-background px-3 text-sm outline-none ring-1 ring-hairline focus:ring-2 focus:ring-brand/60 text-foreground"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Role / Position</span>
                  <input
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g. Senior MLE"
                    className="h-10 rounded-lg bg-background px-3 text-sm outline-none ring-1 ring-hairline focus:ring-2 focus:ring-brand/60"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Language</span>
                  <select
                    value={form.code_language}
                    onChange={(e) => setForm({ ...form, code_language: e.target.value })}
                    className="h-10 rounded-lg bg-background px-3 text-sm outline-none ring-1 ring-hairline focus:ring-2 focus:ring-brand/60 text-foreground"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="go">Go</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the question, constraints..."
                  rows={3}
                  className="resize-none rounded-lg bg-background p-3 text-sm outline-none ring-1 ring-hairline focus:ring-2 focus:ring-brand/60"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Solution Code</span>
                <textarea
                  value={form.solution}
                  onChange={(e) => setForm({ ...form, solution: e.target.value })}
                  placeholder="def solve():\n    pass"
                  rows={4}
                  className="resize-none rounded-lg bg-background p-3 text-sm font-mono outline-none ring-1 ring-hairline focus:ring-2 focus:ring-brand/60 text-purple-300"
                />
              </label>

              {formMessage && (
                <p className={`text-xs font-semibold ${formMessage.includes("successfully") ? "text-easy" : "text-hard"}`}>
                  {formMessage}
                </p>
              )}

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Plus className="size-4" /> Add entry
              </button>
            </form>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{entries.length}</span> custom{" "}
                {entries.length === 1 ? "entry" : "entries"}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Local Database Mode
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 rounded-xl bg-surface/50 p-5 ring-1 ring-hairline animate-pulse flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-16 rounded bg-muted/40 animate-pulse" />
                      <div className="h-4 w-24 rounded bg-muted/40 animate-pulse" />
                    </div>
                    <div className="h-6 w-1/2 rounded bg-muted/40 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-hairline bg-surface/20 text-sm text-muted-foreground">
                No custom questions yet — add your first one on the left.
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="group rounded-xl bg-surface p-5 ring-1 ring-hairline transition-colors hover:ring-brand/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-3 w-full">
                        <div className="flex items-center gap-3">
                          <span className="rounded bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                            {e.company}
                          </span>
                          {e.role && (
                            <span className="text-[10px] text-muted-foreground">
                              💼 {e.role}
                            </span>
                          )}
                          <span className="text-[10px] rounded px-1.5 py-0.2 bg-white/5 font-semibold text-muted-foreground">
                            {e.difficulty}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-foreground">{e.title}</h3>
                        {e.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{e.description}</p>
                        )}
                        {e.solution && (
                          <div className="rounded-lg bg-background p-4 border border-hairline/60 overflow-x-auto">
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground border-b border-hairline/40 pb-2 mb-2">
                              <span>Code Language: <b className="uppercase">{e.code_language || "python"}</b></span>
                              <span>Solution</span>
                            </div>
                            <pre className="font-mono text-xs text-purple-300">
                              <code>{e.solution}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(e.id)}
                        className="rounded-md p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-surface-elevated hover:text-hard group-hover:opacity-100 cursor-pointer"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <AppFooter count={entries.length} />
    </div>
  );
}
