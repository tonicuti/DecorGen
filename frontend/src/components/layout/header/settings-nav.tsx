import { Grid3X3, Info, Keyboard, MousePointer2, Settings, Sliders } from "lucide-react";
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

function SettingsNav() {
  return (
    <div className="pointer-events-auto">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <Settings className="h-4 w-4 transition-transform hover:rotate-45" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          align="end"
          style={{ willChange: "transform, opacity" }}
        >
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
              Workspace Settings
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800">
              <Sliders className="mr-2 h-4 w-4" />
              <span>Render Quality</span>
              <DropdownMenuShortcut>High</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800">
              <Grid3X3 className="mr-2 h-4 w-4" />
              <span>Show Floor Grid</span>
              <DropdownMenuShortcut>G</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800">
              <MousePointer2 className="mr-2 h-4 w-4" />
              <span>Grid Snapping</span>
              <DropdownMenuShortcut>S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800">
              <Keyboard className="mr-2 h-4 w-4" />
              <span>Keyboard Shortcuts</span>
              <DropdownMenuShortcut>⌘/</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800">
              <Info className="mr-2 h-4 w-4" />
              <span>About DecorGen</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { SettingsNav };
