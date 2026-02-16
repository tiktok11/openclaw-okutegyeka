import type { Recipe } from "../lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function RecipeCard({ recipe, onInstall }: { recipe: Recipe; onInstall: (id: string) => void }) {
  return (
    <Card className="bg-panel border-border-subtle">
      <CardHeader>
        <CardTitle className="text-text-main">{recipe.name}</CardTitle>
        <CardDescription>{recipe.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {recipe.tags.map((t) => (
            <Badge key={t} variant="secondary" className="bg-btn-bg border-btn-border text-text-main/80">
              {t}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-text-main/70">Impact: {recipe.impactCategory}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onInstall(recipe.id)} className="bg-btn-bg border border-btn-border text-text-main hover:bg-accent-blue/15">
          Install
        </Button>
      </CardFooter>
    </Card>
  );
}
