import { Badge } from "@/components/ui/badge";

function Logo() {
  return (
    <div className="group pointer-events-auto flex cursor-pointer items-center gap-2.5 transition-opacity select-none hover:opacity-95">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1.5px] shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-500/20 dark:shadow-none">
        <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-white transition-colors duration-300 dark:bg-zinc-950">
          <svg
            className="h-5.5 w-5.5 text-indigo-500 transition-transform duration-500 group-hover:rotate-12 dark:text-indigo-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M 2 7 V 17 L 12 12 V 2 Z"
              fill="currentColor"
              className="text-indigo-500/5 dark:text-indigo-400/5"
              stroke="none"
            />
            <path
              d="M 12 2 V 12 L 22 17 V 7 Z"
              fill="currentColor"
              className="text-indigo-500/10 dark:text-indigo-400/10"
              stroke="none"
            />
            <path
              d="M 2 17 L 12 22 L 22 17 L 12 12 Z"
              fill="currentColor"
              className="text-indigo-500/15 dark:text-indigo-400/15"
              stroke="none"
            />
            <path
              d="M 12 22 V 12 M 2 17 L 12 12 L 22 17"
              className="stroke-indigo-500/30 dark:stroke-indigo-400/30"
              strokeWidth="1"
            />
            <path
              d="M 2 7 V 17 L 12 22 L 22 17 V 7 L 12 2 Z"
              className="stroke-indigo-500/80 dark:stroke-indigo-400/80"
            />
            <path
              d="M 12 6.5 Q 12 10 15.5 10 Q 12 10 12 13.5 Q 12 10 8.5 10 Q 12 10 12 6.5 Z"
              fill="url(#sparkle-grad)"
              stroke="none"
              className="animate-pulse"
            />
            <defs>
              <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <span className="flex items-center text-lg font-bold tracking-tight text-zinc-900 transition-colors dark:text-zinc-100">
        <span>Decor</span>
        <span className="ml-0.5 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Gen
        </span>
      </span>
      <Badge
        variant="outline"
        className="border-indigo-500/20 bg-indigo-500/5 px-1.5 py-0 text-[9px] font-semibold tracking-wider text-indigo-500 uppercase transition-all duration-300 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/10 dark:border-indigo-400/20 dark:bg-indigo-400/5 dark:text-indigo-400 dark:group-hover:border-indigo-400/40"
      >
        Beta
      </Badge>
    </div>
  );
}

export { Logo };
