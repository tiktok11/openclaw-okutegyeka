import { useMemo, useState } from "react";
import type { DiscordGuildChannel, Recipe, RecipeParam } from "../lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function validateField(param: RecipeParam, value: string): string | null {
  const trim = value.trim();
  if (param.required && trim.length === 0) {
    return `${param.label} is required`;
  }
  // Select-based types only need required check
  if (param.type === "discord_guild" || param.type === "discord_channel") {
    return null;
  }
  if (param.minLength != null && trim.length < param.minLength) {
    return `${param.label} is too short`;
  }
  if (param.maxLength != null && trim.length > param.maxLength) {
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
  discordGuildChannels = [],
}: {
  recipe: Recipe;
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onSubmit: () => void;
  discordGuildChannels?: DiscordGuildChannel[];
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const uniqueGuilds = useMemo(() => {
    const seen = new Map<string, string>();
    for (const gc of discordGuildChannels) {
      if (!seen.has(gc.guildId)) {
        seen.set(gc.guildId, gc.guildName);
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [discordGuildChannels]);

  const filteredChannels = useMemo(() => {
    const guildId = values["guild_id"];
    if (!guildId) return [];
    return discordGuildChannels.filter((gc) => gc.guildId === guildId);
  }, [discordGuildChannels, values]);

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

  function renderParam(param: RecipeParam) {
    if (param.type === "discord_guild") {
      return (
        <Select
          value={values[param.id] || undefined}
          onValueChange={(val) => {
            onChange(param.id, val);
            setTouched((prev) => ({ ...prev, [param.id]: true }));
            // Clear channel selection when guild changes
            const channelParam = recipe.params.find((p) => p.type === "discord_channel");
            if (channelParam && values[channelParam.id]) {
              onChange(channelParam.id, "");
            }
          }}
        >
          <SelectTrigger id={param.id} className="w-full">
            <SelectValue placeholder="Select a guild" />
          </SelectTrigger>
          <SelectContent>
            {uniqueGuilds.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (param.type === "discord_channel") {
      const guildSelected = !!values["guild_id"];
      return (
        <Select
          value={values[param.id] || undefined}
          onValueChange={(val) => {
            onChange(param.id, val);
            setTouched((prev) => ({ ...prev, [param.id]: true }));
          }}
          disabled={!guildSelected}
        >
          <SelectTrigger id={param.id} className="w-full">
            <SelectValue
              placeholder={guildSelected ? "Select a channel" : "Select a guild first"}
            />
          </SelectTrigger>
          <SelectContent>
            {filteredChannels.map((c) => (
              <SelectItem key={c.channelId} value={c.channelId}>
                {c.channelName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (param.type === "textarea") {
      return (
        <Textarea
          id={param.id}
          value={values[param.id] || ""}
          placeholder={param.placeholder}
          onBlur={() => setTouched((prev) => ({ ...prev, [param.id]: true }))}
          onChange={(e) => {
            onChange(param.id, e.target.value);
            setTouched((prev) => ({ ...prev, [param.id]: true }));
          }}
        />
      );
    }

    return (
      <Input
        id={param.id}
        value={values[param.id] || ""}
        placeholder={param.placeholder}
        required={param.required}
        onBlur={() => setTouched((prev) => ({ ...prev, [param.id]: true }))}
        onChange={(e) => {
          onChange(param.id, e.target.value);
          setTouched((prev) => ({ ...prev, [param.id]: true }));
        }}
      />
    );
  }

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
          {renderParam(param)}
          {touched[param.id] && errors[param.id] ? (
            <p className="text-sm text-destructive">{errors[param.id]}</p>
          ) : null}
        </div>
      ))}
      <Button
        type="submit"
        disabled={hasError}
      >
        Preview
      </Button>
    </form>
  );
}
