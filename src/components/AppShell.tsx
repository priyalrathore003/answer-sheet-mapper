"use client";

import { useState } from "react";
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
import { Popover } from "./Popover";
import { useToast } from "./Toast";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, active, collapsed, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm select-none w-full text-left transition-colors " +
        (active ? "bg-sidebar-active-bg text-accent font-medium" : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground") +
        (collapsed ? " justify-center" : "")
      }
    >
      <span className="shrink-0 w-4 h-4">{icon}</span>
      {!collapsed && label}
    </button>
  );
}

export function AppShell({ children, breadcrumb }: { children: React.ReactNode; breadcrumb: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const { show, node: toastNode } = useToast();

  const notImplemented = (label: string) => () => show(`${label} isn't part of this demo — it's scoped to Exams.`);

  return (
    <div className="flex min-h-screen bg-white">
      <aside
        className={
          "hidden md:flex flex-col shrink-0 bg-sidebar text-sidebar-foreground px-3 py-5 transition-[width] duration-200 " +
          (collapsed ? "w-[72px] items-center" : "w-[272px]")
        }
      >
        <div className={"flex items-center mb-5 " + (collapsed ? "flex-col gap-3" : "justify-between px-1")}>
          <div className={"flex items-center gap-2.5 " + (collapsed ? "flex-col" : "")}>
            <div className="h-7 w-7 rounded-md bg-accent text-white flex items-center justify-center text-sm font-bold shrink-0">
              A
            </div>
            {!collapsed && <span className="font-semibold tracking-tight text-sm">Answer Sheet Mapper</span>}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1 rounded hover:bg-white/10 text-sidebar-muted hover:text-sidebar-foreground transition-colors shrink-0"
          >
            <IconPanel className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={notImplemented("AI Teacher's Toolkit")}
          title="AI Teacher's Toolkit"
          className={
            "flex items-center gap-2 mb-5 px-3 py-2 rounded-lg border border-accent/40 bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors " +
            (collapsed ? "justify-center w-auto" : "w-full")
          }
        >
          <IconSparkle className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && "AI Teacher's Toolkit"}
        </button>

        <nav className="flex flex-col gap-0.5 w-full">
          <NavItem icon={<IconHome className="w-full h-full" />} label="Home" collapsed={collapsed} onClick={notImplemented("Home")} />
          <NavItem
            icon={<IconClassroom className="w-full h-full" />}
            label="My Classroom"
            collapsed={collapsed}
            onClick={notImplemented("My Classroom")}
          />
          <NavItem
            icon={<IconAssignments className="w-full h-full" />}
            label="Assignments"
            collapsed={collapsed}
            onClick={notImplemented("Assignments")}
          />
          <NavItem icon={<IconExams className="w-full h-full" />} label="Exams" active collapsed={collapsed} />
          <NavItem
            icon={<IconLibrary className="w-full h-full" />}
            label="My Library"
            collapsed={collapsed}
            onClick={notImplemented("My Library")}
          />
        </nav>

        {!collapsed && (
          <div className="mt-auto flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 w-full">
            <div className="h-7 w-7 rounded-md bg-white/10 flex items-center justify-center text-xs shrink-0">🏫</div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">Demo School</div>
              <div className="text-[11px] text-sidebar-muted truncate">Sample workspace</div>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-900/[.06]">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <IconBack className="w-4 h-4" />
            {breadcrumb}
          </div>
          <div className="flex items-center gap-4">
            <Popover
              width={240}
              trigger={({ toggle }) => (
                <button
                  onClick={toggle}
                  aria-label="Help"
                  className="text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  <IconHelp className="w-5 h-5" />
                </button>
              )}
            >
              <div className="animate-popin">
                <p className="font-medium text-neutral-800 mb-1">How this works</p>
                <p className="text-neutral-500 leading-relaxed">
                  Upload a question paper and one student&apos;s answer sheet. We&apos;ll extract every question and
                  answer, map them together, and highlight exactly where each answer was written.
                </p>
              </div>
            </Popover>

            <Popover
              width={220}
              trigger={({ toggle }) => (
                <button onClick={toggle} aria-label="Notifications" className="relative text-neutral-400 hover:text-neutral-700 transition-colors">
                  <IconBell className="w-5 h-5" />
                  <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
                </button>
              )}
            >
              <div className="animate-popin text-center py-2">
                <p className="text-neutral-800 font-medium">You&apos;re all caught up</p>
                <p className="text-neutral-400 text-xs mt-0.5">No new notifications</p>
              </div>
            </Popover>

            <IconSparkle className="w-4 h-4 text-accent" />

            <Popover
              width={220}
              trigger={({ open, toggle }) => (
                <button
                  onClick={toggle}
                  className="flex items-center gap-2 pl-3 border-l border-neutral-900/[.08] group"
                  aria-expanded={open}
                >
                  <div className="h-7 w-7 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xs font-semibold">
                    D
                  </div>
                  <span className="text-sm font-medium text-neutral-700 hidden sm:inline">Demo Teacher</span>
                  <IconChevron className={"w-3.5 h-3.5 text-neutral-400 transition-transform " + (open ? "rotate-180" : "")} />
                </button>
              )}
            >
              <div className="animate-popin flex flex-col gap-0.5">
                <p className="text-xs text-neutral-400 px-1 pb-1.5 mb-1 border-b border-neutral-100">
                  No sign-in required for this demo
                </p>
                <a
                  href="https://github.com/priyalrathore003/answer-sheet-mapper"
                  target="_blank"
                  rel="noreferrer"
                  className="px-1 py-1.5 rounded-md hover:bg-neutral-50 text-neutral-700"
                >
                  GitHub repository ↗
                </a>
                <a
                  href="https://github.com/priyalrathore003/answer-sheet-mapper/blob/main/LLD.md"
                  target="_blank"
                  rel="noreferrer"
                  className="px-1 py-1.5 rounded-md hover:bg-neutral-50 text-neutral-700"
                >
                  Design docs ↗
                </a>
              </div>
            </Popover>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>
      </div>
      {toastNode}
    </div>
  );
}
