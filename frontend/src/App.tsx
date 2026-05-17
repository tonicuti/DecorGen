import { ThemeProvider } from "@/context/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="relative min-h-screen overflow-hidden bg-white text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-50">
        <main className="p-4">DecorGen</main>
      </div>
    </ThemeProvider>
  );
}

export { App };
