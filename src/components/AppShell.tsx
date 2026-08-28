"use client";

import { IconAssignments, IconClassroom, IconExams, IconHelp, IconHome, IconLibrary } from "./icons";

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
        (active
          ? "bg-accent-soft text-accent font-medium"
          : "text-neutral-500 dark:text-neutral-400")
      }
    >
      <span className="shrink-0 w-4 h-4">{icon}</span>
      {label}
    </div>
  );
}

export function AppShell({ children, breadcrumb }: { children: React.ReactNode; breadcrumb: string }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-neutral-900/[.06] dark:border-white/[.08] px-4 py-5">
        <div className="flex items-center gap-2.5 px-1 mb-6">
          <div className="h-7 w-7 rounded-md bg-accent text-white flex items-center justify-center text-sm font-bold shrink-0">
            A
          </div>
          <span className="font-semibold tracking-tight text-sm">Answer Sheet Mapper</span>
        </div>

        <nav className="flex flex-col gap-0.5">
          <NavItem icon={<IconHome className="w-full h-full" />} label="Home" />
          <NavItem icon={<IconClassroom className="w-full h-full" />} label="My Classroom" />
          <NavItem icon={<IconAssignments className="w-full h-full" />} label="Assignments" />
          <NavItem icon={<IconExams className="w-full h-full" />} label="Exams" active />
          <NavItem icon={<IconLibrary className="w-full h-full" />} label="My Library" />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-900/[.06] dark:border-white/[.08]">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{breadcrumb}</span>
          <IconHelp className="w-5 h-5 text-neutral-400" />
        </header>

        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
