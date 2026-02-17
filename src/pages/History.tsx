import { useEffect, useReducer } from "react";
import { api } from "../lib/api";
import { initialState, reducer } from "../lib/state";
import { DiffViewer } from "../components/DiffViewer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function History() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const refreshHistory = () =>
    api.listHistory(50, 0)
      .then((resp) => dispatch({ type: "setHistory", history: resp.items }))
      .catch(() => dispatch({ type: "setMessage", message: "Failed to load history" }));

  useEffect(() => {
    refreshHistory();
  }, []);

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">History</h2>
      <div className="space-y-3">
        {state.history.map((item) => (
          <Card key={item.id}>
            <CardContent>
              <p className="text-sm">
                {item.createdAt} · {item.recipeId || "manual"} · {item.source}
                {!item.canRollback && (
                  <Badge variant="outline" className="ml-2">not rollbackable</Badge>
                )}
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const preview = await api.previewRollback(item.id);
                      dispatch({ type: "setPreview", preview });
                    } catch (err) {
                      dispatch({ type: "setMessage", message: String(err) });
                    }
                  }}
                  disabled={!item.canRollback}
                >
                  Preview rollback
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (!item.canRollback) {
                      dispatch({
                        type: "setMessage",
                        message: "This snapshot cannot be rolled back",
                      });
                      return;
                    }
                    try {
                      await api.rollback(item.id);
                      dispatch({ type: "setMessage", message: "Rollback completed" });
                      await refreshHistory();
                    } catch (err) {
                      dispatch({ type: "setMessage", message: String(err) });
                    }
                  }}
                  disabled={!item.canRollback}
                >
                  Rollback
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {state.lastPreview && (
        <DiffViewer
          oldValue={state.lastPreview.configBefore}
          newValue={state.lastPreview.configAfter}
        />
      )}
      <Button variant="outline" onClick={refreshHistory} className="mt-3">
        Refresh
      </Button>
      <p className="text-sm text-muted-foreground mt-2">{state.message}</p>
    </section>
  );
}
