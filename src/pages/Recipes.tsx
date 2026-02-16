import { useEffect, useReducer, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import { RecipeCard } from "../components/RecipeCard";
import { initialState, reducer } from "../lib/state";
import type { Recipe } from "../lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function Recipes({
  onInstall,
}: {
  onInstall: (id: string, source?: string) => void;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [source, setSource] = useState("");
  const [loadedSource, setLoadedSource] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const load = (nextSource: string) => {
    setIsLoading(true);
    const value = nextSource.trim();
    api
      .listRecipes(value || undefined)
      .then((recipes) => {
        setLoadedSource(value || undefined);
        dispatch({ type: "setRecipes", recipes });
      })
      .catch(() => dispatch({ type: "setMessage", message: "Failed to load recipes" }))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load("");
  }, []);

  const onLoadSource = (event: FormEvent) => {
    event.preventDefault();
    load(source);
  };

  return (
    <section>
      <h2 className="text-2xl font-bold text-text-main mb-4">Recipes</h2>
      <form onSubmit={onLoadSource} className="mb-2 flex items-center gap-2">
        <Label>Recipe source (file path or URL)</Label>
        <Input
          value={source}
          onChange={(event) => setSource(event.target.value)}
          placeholder="/path/recipes.json or https://example.com/recipes.json"
          className="w-[380px] bg-panel border-border-subtle text-text-main"
        />
        <Button type="submit" className="ml-2">
          {isLoading ? "Loading..." : "Load"}
        </Button>
      </form>
      <p className="text-sm text-text-main/80 mt-0">
        Loaded from: {loadedSource || "builtin / clawpal recipes"}
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {state.recipes.map((recipe: Recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onInstall={() => onInstall(recipe.id, loadedSource)}
          />
        ))}
      </div>
    </section>
  );
}
