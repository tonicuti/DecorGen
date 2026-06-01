import { CreditCard, Key, LogOut, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function UserNav() {
  return (
    <div className="pointer-events-auto flex items-center gap-2">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-0 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <User className="h-4 w-4 text-zinc-600 transition-transform hover:scale-110 dark:text-zinc-300" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-60 border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          align="end"
          style={{ willChange: "transform, opacity" }}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <p className="text-sm leading-none font-medium text-zinc-900 dark:text-zinc-100">
                  Gia An
                </p>
                <p className="text-xs leading-none text-zinc-400 dark:text-zinc-500">
                  engineer@decorgen.com
                </p>
              </div>
              <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-600 uppercase dark:bg-emerald-500/20 dark:text-emerald-400">
                Pro
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing & Plan</span>
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800">
              <Key className="mr-2 h-4 w-4" />
              <span>API Keys</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800">
              <Users className="mr-2 h-4 w-4" />
              <span>Team Management</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
          <DropdownMenuItem className="cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-500/10">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { UserNav };
