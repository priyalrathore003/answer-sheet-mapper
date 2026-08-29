"use client";

import {
  IconAssignments,
  IconBack,
  IconBell,
  IconChevron,
  IconClassroom,
  IconExams,
  IconHelp,
  IconHome,
  IconLibrary,
  IconPanel,
  IconSparkle,
} from "./icons";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function NavItem({ icon, label, active }: NavItemProps) {
  // Not real destinations — this app is one screen. Rendered to match the
  // reference design's navigation shell, not wired to fake functionality.
  return (
    <div
      className={
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm select-none " +
        (active ? "bg-sidebar-active-bg text-accent font-medium" : "text-sidebar-muted")
      }
    >
      <span className="shrink-0 w-4 h-4">{icon}</span>
      {label}
    </div>
  );
}

export function AppShell({ children, breadcrumb }: { children: React.ReactNode; breadcrumb: string }) {
  return (
    <div className="flex min-h-screen bg-white">
      <aside className="hidden md:flex flex-col w-[272px] shrink-0 bg-sidebar text-sidebar-foreground px-4 py-5">
        <div className="flex items-center justify-between px-1 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-accent text-white flex items-center justify-center text-sm font-bold shrink-0">
              A
            </div>
            <span className="font-semibold tracking-tight text-sm">Answer Sheet Mapper</span>
          </div>
          <IconPanel className="w-4 h-4 text-sidebar-muted shrink-0" />
        </div>

        <button
          type="button"
          className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg border border-accent/40 bg-accent/10 text-accent text-sm font-medium"
        >
          <IconSparkle className="w-3.5 h-3.5" />
          AI Teacher&apos;s Toolkit
        </button>

        <nav className="flex flex-col gap-0.5">
          <NavItem icon={<IconHome className="w-full h-full" />} label="Home" />
          <NavItem icon={<IconClassroom className="w-full h-full" />} label="My Classroom" />
          <NavItem icon={<IconAssignments className="w-full h-full" />} label="Assignments" />
          <NavItem icon={<IconExams className="w-full h-full" />} label="Exams" active />
          <NavItem icon={<IconLibrary className="w-full h-full" />} label="My Library" />
        </nav>

        <div className="mt-auto flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5">
          <div className="h-7 w-7 rounded-md bg-white/10 flex items-center justify-center text-xs shrink-0">🏫</div>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate">Demo School</div>
            <div className="text-[11px] text-sidebar-muted truncate">Sample workspace</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-900/[.06]">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <IconBack className="w-4 h-4" />
            {breadcrumb}
          </div>
          <div className="flex items-center gap-4">
            <IconHelp className="w-5 h-5 text-neutral-400" />
            <div className="relative">
              <IconBell className="w-5 h-5 text-neutral-400" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
            </div>
            <IconSparkle className="w-4 h-4 text-accent" />
            <div className="flex items-center gap-2 pl-3 border-l border-neutral-900/[.08]">
              <div className="h-7 w-7 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xs font-semibold">
                D
              </div>
              <span className="text-sm font-medium text-neutral-700 hidden sm:inline">Demo Teacher</span>
              <IconChevron className="w-3.5 h-3.5 text-neutral-400" />
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
