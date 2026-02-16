import { useMemo, useState } from "react";
import type { Recipe, RecipeParam } from "../lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function validateField(param: RecipeParam, value: string): string | null {
  const trim = value.trim();
  if (param.required && trim.length === 0) {
    return `${param.label} is required`;
  }
  if (param.minLength !== undefined && trim.length < param.minLength) {
    return `${param.label} is too short`;
  }
  if (param.maxLength !== undefined && trim.length > param.maxLength) {
    return `${param.label} is too long`;
  }
  if (param.pattern && trim.length > 0) {
    try {
      if (!new RegExp(param.pattern).test(trim)) {
        return `${param.label} format is invalid`;
      }
    } catch {
      return `${param.label} has invalid validation rule`;
    }
  }
  return null;
}

export function ParamForm({
  recipe,
  values,
  onChange,
  onSubmit,
}: {
  recipe: Recipe;
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onSubmit: () => void;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    for (const param of recipe.params) {
      const err = validateField(param, values[param.id] || "");
      if (err) {
        next[param.id] = err;
      }
    }
    return next;
  }, [recipe.params, values]);
  const hasError = Object.keys(errors).length > 0;

  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      if (hasError) {
        return;
      }
      onSubmit();
    }}>
      {recipe.params.map((param: RecipeParam) => (
        <div key={param.id} className="space-y-1.5">
          <Label htmlFor={param.id}>{param.label}</Label>
          {param.type === "textarea" ? (
            <Textarea
              id={param.id}
              className="bg-panel border-border-subtle text-text-main"
              value={values[param.id] || ""}
              placeholder={param.placeholder}
              onBlur={() => setTouched((prev) => ({ ...prev, [param.id]: true }))}
              onChange={(e) => {
                onChange(param.id, e.target.value);
                setTouched((prev) => ({ ...prev, [param.id]: true }));
              }}
            />
          ) : (
            <Input
              id={param.id}
              className="bg-panel border-border-subtle text-text-main"
              value={values[param.id] || ""}
              placeholder={param.placeholder}
              required={param.required}
              onBlur={() => setTouched((prev) => ({ ...prev, [param.id]: true }))}
              onChange={(e) => {
                onChange(param.id, e.target.value);
                setTouched((prev) => ({ ...prev, [param.id]: true }));
              }}
            />
          )}
          {touched[param.id] && errors[param.id] ? (
            <p className="text-sm text-destructive-red">{errors[param.id]}</p>
          ) : null}
        </div>
      ))}
      <Button
        type="submit"
        disabled={hasError}
        className="bg-btn-bg border border-btn-border text-text-main hover:bg-accent-blue/15"
      >
        Preview
      </Button>
    </form>
  );
}
