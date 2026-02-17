import type { Recipe } from "../lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function RecipeCard({ recipe, onCook }: { recipe: Recipe; onCook: (id: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{recipe.name}</CardTitle>
        <CardDescription>{recipe.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {recipe.tags.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {recipe.steps.length} step{recipe.steps.length !== 1 ? "s" : ""} &middot; {recipe.difficulty}
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onCook(recipe.id)}>
          Cook
        </Button>
      </CardFooter>
    </Card>
  );
}
