import { useCallback, useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { Recipes } from "./pages/Recipes";
import { Cook } from "./pages/Cook";
import { History } from "./pages/History";
import { Doctor } from "./pages/Doctor";
import { Settings } from "./pages/Settings";
import { Channels } from "./pages/Channels";
import { GlobalLoading } from "./components/GlobalLoading";
import { api } from "./lib/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { DiscordGuildChannel } from "./lib/types";

type Route = "home" | "recipes" | "cook" | "history" | "channels" | "doctor" | "settings";

export function App() {
  const [route, setRoute] = useState<Route>("home");
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [recipeSource, setRecipeSource] = useState<string | undefined>(undefined);
  const [discordGuildChannels, setDiscordGuildChannels] = useState<DiscordGuildChannel[]>([]);
  const [globalLoading, setGlobalLoading] = useState<string | null>(null);

  // Load Discord data from cache on startup (instant, no subprocess)
  useEffect(() => {
    if (!localStorage.getItem("clawpal_profiles_extracted")) {
      api.extractModelProfilesFromConfig()
        .then(() => localStorage.setItem("clawpal_profiles_extracted", "1"))
        .catch(() => {});
    }
    api.listDiscordGuildChannels().then(setDiscordGuildChannels).catch(() => {});
  }, []);

  const refreshDiscord = useCallback(() => {
    setGlobalLoading("Resolving Discord channel names...");
    api.refreshDiscordGuildChannels()
      .then(setDiscordGuildChannels)
      .catch(() => {})
      .finally(() => setGlobalLoading(null));
  }, []);

  return (
    <>
    {globalLoading && <GlobalLoading message={globalLoading} />}
    <div className="flex h-screen">
      <aside className="w-[200px] min-w-[200px] bg-muted border-r border-border flex flex-col py-4">
        <h1 className="px-4 text-lg font-bold mb-4">ClawPal</h1>
        <nav className="flex flex-col gap-1 px-2">
          <Button
            variant="ghost"
            className={cn(
              "justify-start hover:bg-accent",
              (route === "home") && "bg-accent text-accent-foreground border-l-[3px] border-primary"
            )}
            onClick={() => setRoute("home")}
          >
            Home
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "justify-start hover:bg-accent",
              (route === "recipes" || route === "cook") && "bg-accent text-accent-foreground border-l-[3px] border-primary"
            )}
            onClick={() => setRoute("recipes")}
          >
            Recipes
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "justify-start hover:bg-accent",
              (route === "channels") && "bg-accent text-accent-foreground border-l-[3px] border-primary"
            )}
            onClick={() => setRoute("channels")}
          >
            Channels
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "justify-start hover:bg-accent",
              (route === "history") && "bg-accent text-accent-foreground border-l-[3px] border-primary"
            )}
            onClick={() => setRoute("history")}
          >
            History
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "justify-start hover:bg-accent",
              (route === "doctor") && "bg-accent text-accent-foreground border-l-[3px] border-primary"
            )}
            onClick={() => setRoute("doctor")}
          >
            Doctor
          </Button>
          <Separator className="my-2" />
          <Button
            variant="ghost"
            className={cn(
              "justify-start hover:bg-accent",
              (route === "settings") && "bg-accent text-accent-foreground border-l-[3px] border-primary"
            )}
            onClick={() => setRoute("settings")}
          >
            Settings
          </Button>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-4">
        {route === "home" && <Home />}
        {route === "recipes" && (
          <Recipes
            onCook={(id, source) => {
              setRecipeId(id);
              setRecipeSource(source);
              setRoute("cook");
            }}
          />
        )}
        {route === "cook" && recipeId && (
          <Cook
            recipeId={recipeId}
            recipeSource={recipeSource}
            discordGuildChannels={discordGuildChannels}
            onDone={() => {
              setRoute("recipes");
            }}
          />
        )}
        {route === "cook" && !recipeId && <p>No recipe selected.</p>}
        {route === "channels" && (
          <Channels
            discordGuildChannels={discordGuildChannels}
            onRefresh={refreshDiscord}
          />
        )}
        {route === "history" && <History />}
        {route === "doctor" && <Doctor />}
        {route === "settings" && <Settings />}
        {route === "cook" && (
          <Button
            variant="ghost"
            className="mt-3 hover:bg-accent"
            onClick={() => setRoute("recipes")}
          >
            ← Recipes
          </Button>
        )}
      </main>
    </div>
    </>
  );
}
