import { useEffect, useReducer, useState } from "react";
import { api } from "../lib/api";
import { ParamForm } from "../components/ParamForm";
import { DiffViewer } from "../components/DiffViewer";
import { initialState, reducer } from "../lib/state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Install({
  recipeId,
  onDone,
  recipeSource,
}: {
  recipeId: string;
  onDone?: () => void;
  recipeSource?: string;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [params, setParams] = useState<Record<string, string>>({});
  const [isApplying, setIsApplying] = useState(false);
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

  if (!recipe) return <div className="text-text-main">Recipe not found</div>;

  return (
    <section>
      <h2 className="text-2xl font-bold text-text-main mb-4">
        Install {recipe.name}
      </h2>
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
      />
      {state.lastPreview && (
        <Card className="mt-4 bg-panel border-border-subtle">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-text-main mb-2">
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DiffViewer value={state.lastPreview.diff} />
            <div className="flex items-center mt-3">
              <Button
                disabled={isApplying}
                onClick={() => {
                  setIsApplying(true);
                  api.applyRecipe(recipe.id, params, recipeSource)
                    .then((result) => {
                      if (!result.ok) {
                        const errors = result.errors.length ? result.errors.join(", ") : "failed";
                        dispatch({ type: "setMessage", message: `Apply failed: ${errors}` });
                        return;
                      }
                      dispatch({
                        type: "setMessage",
                        message: result.snapshotId
                          ? `Applied successfully. Snapshot: ${result.snapshotId}`
                          : "Applied successfully",
                      });
                      if (onDone) {
                        onDone();
                      }
                    })
                    .catch((err) => dispatch({ type: "setMessage", message: String(err) }))
                    .finally(() => setIsApplying(false));
                }}
              >
                Apply
              </Button>
              {isPreviewing ? <span className="text-sm text-text-main/60 ml-2">...previewing</span> : null}
              {isApplying ? <span className="text-sm text-text-main/60 ml-2">...applying</span> : null}
            </div>
          </CardContent>
        </Card>
      )}
      <p className="text-sm text-text-main/70 mt-2">{state.message}</p>
    </section>
  );
}
