import { useEffect, useReducer, useState } from "react";
import { api } from "../lib/api";
import { ParamForm } from "../components/ParamForm";
import { DiffViewer } from "../components/DiffViewer";
import { initialState, reducer } from "../lib/state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DiscordGuildChannel } from "../lib/types";

type ApplyPhase =
  | { step: "idle" }
  | { step: "applying" }
  | { step: "applied"; snapshotId?: string }
  | { step: "restarting" }
  | { step: "done" }
  | { step: "error"; message: string };

export function Cook({
  recipeId,
  onDone,
  recipeSource,
  discordGuildChannels,
}: {
  recipeId: string;
  onDone?: () => void;
  recipeSource?: string;
  discordGuildChannels: DiscordGuildChannel[];
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [params, setParams] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<ApplyPhase>({ step: "idle" });
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    api.listRecipes(recipeSource).then((recipes) => {
      const recipe = recipes.find((it) => it.id === recipeId);
      dispatch({ type: "setRecipes", recipes });
      if (!recipe) return;
      const defaults: Record<string, string> = {};
      for (const p of recipe.params) {
        defaults[p.id] = "";
      }
      setParams(defaults);
    });
  }, [recipeId, recipeSource]);

  const recipe = state.recipes.find((r) => r.id === recipeId);

  if (!recipe) return <div>Recipe not found</div>;

  const handleApply = async () => {
    setPhase({ step: "applying" });
    try {
      const result = await api.applyRecipe(recipe.id, params, recipeSource);
      if (!result.ok) {
        const errors = result.errors.length ? result.errors.join(", ") : "failed";
        setPhase({ step: "error", message: `Apply failed: ${errors}` });
        return;
      }
      setPhase({ step: "applied", snapshotId: result.snapshotId });

      setPhase({ step: "restarting" });
      try {
        await api.restartGateway();
      } catch {
        // Gateway restart failed — config is still applied, just warn
      }
      setPhase({ step: "done" });
    } catch (err) {
      setPhase({ step: "error", message: String(err) });
    }
  };

  const isBusy = phase.step === "applying" || phase.step === "restarting";

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">
        Cook {recipe.name}
      </h2>

      {phase.step === "done" ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-2xl mb-2">&#10003;</div>
            <p className="text-lg font-medium">Recipe applied successfully</p>
            <p className="text-sm text-muted-foreground mt-1">
              Gateway has been restarted. The changes are now in effect.
            </p>
            <Button className="mt-4" onClick={onDone}>
              Back to Recipes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <ParamForm
            recipe={recipe}
            values={params}
            onChange={(id, value) => setParams((prev) => ({ ...prev, [id]: value }))}
            onSubmit={() => {
              setIsPreviewing(true);
              api.previewApply(recipe.id, params, recipeSource)
                .then((preview) => dispatch({ type: "setPreview", preview }))
                .catch((err) => dispatch({ type: "setMessage", message: String(err) }))
                .finally(() => setIsPreviewing(false));
            }}
            discordGuildChannels={discordGuildChannels}
          />
          {state.lastPreview && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold mb-2">
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DiffViewer
                  oldValue={state.lastPreview.configBefore}
                  newValue={state.lastPreview.configAfter}
                />
                <div className="flex items-center gap-3 mt-3">
                  <Button disabled={isBusy} onClick={handleApply}>
                    Apply
                  </Button>
                  {phase.step === "applying" && (
                    <span className="text-sm text-muted-foreground">Applying config...</span>
                  )}
                  {phase.step === "restarting" && (
                    <span className="text-sm text-muted-foreground">Restarting gateway...</span>
                  )}
                  {phase.step === "error" && (
                    <span className="text-sm text-destructive">{phase.message}</span>
                  )}
                  {isPreviewing && (
                    <span className="text-sm text-muted-foreground">Previewing...</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          <p className="text-sm text-muted-foreground mt-2">{state.message}</p>
        </>
      )}
    </section>
  );
}
