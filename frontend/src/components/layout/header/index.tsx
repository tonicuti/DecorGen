import { ActionBar } from "@/components/layout/header/action-bar";
import { CommandBar } from "@/components/layout/header/command-bar";
import { Logo } from "@/components/layout/header/logo";
import { SettingsNav } from "@/components/layout/header/settings-nav";
import { ThemeToggle } from "@/components/layout/header/theme-toggle";
import { UserNav } from "@/components/layout/header/user-nav";

function Header() {
  return (
    <header className="pointer-events-none flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-md transition-colors duration-300 dark:border-zinc-800/60 dark:bg-zinc-950/80">
      <div className="flex items-center gap-4">
        <Logo />
      </div>
      <CommandBar />
      <div className="flex items-center gap-3">
        <ActionBar />
        <div className="pointer-events-auto flex items-center justify-center">
          <ThemeToggle />
        </div>
        <SettingsNav />
        <UserNav />
      </div>
    </header>
  );
}

export { Header };
