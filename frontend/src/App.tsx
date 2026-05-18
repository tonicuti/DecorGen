import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/context/theme-provider";

function App() {
  const [viewMode] = useState<"3d" | "2d">("3d");

  return (
    <ThemeProvider defaultTheme="dark">
      <div className="relative min-h-screen overflow-hidden bg-white text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-50">
        <Header />
        <Sidebar viewMode={viewMode} />
        <main className="p-4">DecorGen</main>
      </div>
    </ThemeProvider>
  );
}

export { App };
