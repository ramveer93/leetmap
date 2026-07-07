import { Link } from "@tanstack/react-router";
import { Command } from "lucide-react";

type Tab = "problems" | "portal";

export function AppHeader({ active }: { active: Tab }) {
  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-hairline bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-6 place-items-center rounded bg-brand">
            <div className="size-2.5 rounded-sm bg-background" />
          </div>
          <span className="font-semibold tracking-tight text-foreground">
            LeetMap
          </span>
        </Link>
        <div className="flex h-8 items-center gap-1 rounded-lg bg-surface/60 p-1 ring-1 ring-hairline">
          <Link
            to="/"
            className={
              active === "problems"
                ? "rounded-md bg-surface-elevated px-3 py-1 text-sm font-medium text-foreground shadow-sm"
                : "rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            }
          >
            Problems
          </Link>
          <Link
            to="/portal"
            className={
              active === "portal"
                ? "rounded-md bg-surface-elevated px-3 py-1 text-sm font-medium text-foreground shadow-sm"
                : "rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            }
          >
            Portal
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 font-mono text-xs text-muted-foreground sm:flex">
          <span className="flex items-center gap-1 rounded border border-hairline bg-surface px-1.5 py-0.5">
            <Command className="size-3" />
          </span>
          <span className="rounded border border-hairline bg-surface px-1.5 py-0.5">K</span>
        </div>
        <div className="size-8 rounded-full bg-gradient-to-br from-brand to-medium ring-1 ring-black/10" />
      </div>
    </nav>
  );
}

export function AppFooter({ count }: { count: number }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-hairline bg-background/90 px-4 py-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-easy shadow-[0_0_8px_var(--easy)]" />
            Index Sync: OK
          </div>
          <span className="hidden sm:inline">{count.toLocaleString()} Problems Indexed</span>
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">v2.4.0-stable</div>
      </div>
    </footer>
  );
}
