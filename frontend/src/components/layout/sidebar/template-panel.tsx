import { Home, ImageIcon, Search, Sparkles } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { searchRoomTemplates } from "@/api/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importProjectGLBFromUrl } from "@/lib/export-scene-glb";
import { generateModelThumbnailFromUrl } from "@/lib/thumbnail-generator";
import type { RoomTemplate } from "@/types";

function TemplatePreview({ template }: { template: RoomTemplate }) {
  const [thumbnail, setThumbnail] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setThumbnail(null);
    setFailed(false);

    generateModelThumbnailFromUrl(template.glbUrl)
      .then((image) => {
        if (!cancelled) setThumbnail(image);
      })
      .catch((err) => {
        console.error("Failed to render template thumbnail:", err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [template.glbUrl]);

  return (
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
      {thumbnail ? (
        <img src={thumbnail} alt={template.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-500">
          {failed ? (
            <ImageIcon className="h-6 w-6" />
          ) : (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          )}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: RoomTemplate }) {
  const [isApplying, setIsApplying] = React.useState(false);

  const handleUseTemplate = async () => {
    setIsApplying(true);
    try {
      const metadata = await importProjectGLBFromUrl(template.glbUrl);
      toast.success(`Loaded ${template.name} with ${metadata.objects.length} project objects.`);
    } catch (err) {
      console.error("Failed to import template project:", err);
      toast.error("This template GLB does not contain project metadata.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white p-2 shadow-sm transition-colors hover:border-indigo-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/50">
      <TemplatePreview template={template} />
      <div className="mt-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {template.name}
          </h3>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="truncate">{template.style || template.category}</span>
            {template.roomType && (
              <>
                <span className="shrink-0 text-zinc-300 dark:text-zinc-700">/</span>
                <span className="truncate">{template.roomType.replaceAll("_", " ")}</span>
              </>
            )}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={isApplying}
          onClick={handleUseTemplate}
          className="h-8 shrink-0 rounded-lg bg-indigo-600 px-3 text-xs text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          {isApplying ? "Loading" : "Use"}
        </Button>
      </div>
      {template.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {template.description}
        </p>
      )}
    </div>
  );
}

function TemplatePanel() {
  const [query, setQuery] = React.useState("");
  const [templates, setTemplates] = React.useState<RoomTemplate[]>([]);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);

  const handleSearch = async () => {
    const prompt = query.trim();
    if (!prompt) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchRoomTemplates(prompt, 4);
      setTemplates(results);
    } catch (err) {
      console.error("Failed to search room templates:", err);
      toast.error("Template search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Room Templates</h2>
        </div>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          {templates.length} matches
        </span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <div className="relative w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 transition-all duration-300 ease-in-out focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-9 items-center">
                <Search className="absolute left-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSearch();
                    }
                  }}
                  placeholder="Describe the room you want..."
                  className="h-full w-full border-0! bg-transparent! pr-3 pl-9 text-sm text-zinc-900 shadow-none! placeholder:text-zinc-400 focus-visible:ring-0! focus-visible:ring-offset-0! dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            disabled={isSearching}
            onClick={() => void handleSearch()}
            className="h-9 w-9 shrink-0 rounded-lg border border-indigo-500 bg-indigo-500/10 text-indigo-500 transition-all hover:bg-indigo-500/20 disabled:opacity-50 dark:border-indigo-500 dark:bg-indigo-950/20"
            title="Search Templates"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {templates.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-60 flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
              <Home className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {hasSearched ? "No matching templates" : "Search room templates"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export { TemplatePanel };
