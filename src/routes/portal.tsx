import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { AppFooter, AppHeader } from "@/components/app-chrome";
import { PROBLEMS } from "@/lib/problems";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Custom Questions Portal — Company Companion" },
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
  id: string;
  company: string;
  question: string;
  notes: string;
  date: string;
};

function Portal() {
  const [entries, setEntries] = useState<Entry[]>([
    {
      id: crypto.randomUUID(),
      company: "Stripe",
      question: "Design a rate limiter for the payments API",
      notes: "Discussed token bucket + sliding window. Follow-up on Redis atomicity.",
      date: "2026-06-14",
    },
  ]);
  const [form, setForm] = useState({ company: "", question: "", notes: "" });

  const add = () => {
    if (!form.company.trim() || !form.question.trim()) return;
    setEntries((e) => [
      {
        id: crypto.randomUUID(),
        company: form.company.trim(),
        question: form.question.trim(),
        notes: form.notes.trim(),
        date: new Date().toISOString().slice(0, 10),
      },
      ...e,
    ]);
    setForm({ company: "", question: "", notes: "" });
  };

  const remove = (id: string) => setEntries((e) => e.filter((x) => x.id !== id));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader active="portal" />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 pb-20">
        <header className="flex flex-col gap-2">
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
        </header>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <section className="flex h-fit flex-col gap-4 rounded-2xl bg-surface p-6 ring-1 ring-hairline">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              New entry
            </h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Company</span>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g. Stripe"
                className="h-10 rounded-lg bg-background px-3 text-sm outline-none ring-1 ring-hairline focus:ring-2 focus:ring-brand/60"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Question</span>
              <input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="What were you asked?"
                className="h-10 rounded-lg bg-background px-3 text-sm outline-none ring-1 ring-hairline focus:ring-2 focus:ring-brand/60"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Approach, follow-ups, gotchas…"
                rows={4}
                className="resize-none rounded-lg bg-background p-3 text-sm outline-none ring-1 ring-hairline focus:ring-2 focus:ring-brand/60"
              />
            </label>
            <button
              onClick={add}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              <Plus className="size-4" /> Add entry
            </button>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{entries.length}</span> custom
                entr{entries.length === 1 ? "y" : "ies"}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Local · {PROBLEMS.length} indexed problems available
              </span>
            </div>

            {entries.length === 0 ? (
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
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="rounded bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                            {e.company}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {e.date}
                          </span>
                        </div>
                        <h3 className="text-base font-medium text-foreground">{e.question}</h3>
                        {e.notes && (
                          <p className="text-sm text-muted-foreground">{e.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => remove(e.id)}
                        className="rounded-md p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-surface-elevated hover:text-hard group-hover:opacity-100"
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

      <AppFooter count={PROBLEMS.length} />
    </div>
  );
}
