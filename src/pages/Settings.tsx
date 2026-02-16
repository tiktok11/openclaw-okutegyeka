import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import type { ModelCatalogProvider, ModelProfile, ResolvedApiKey } from "../lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ProfileForm = {
  id: string;
  provider: string;
  model: string;
  apiKey: string;
  useCustomUrl: boolean;
  baseUrl: string;
  enabled: boolean;
};

function emptyForm(): ProfileForm {
  return {
    id: "",
    provider: "",
    model: "",
    apiKey: "",
    useCustomUrl: false,
    baseUrl: "",
    enabled: true,
  };
}

const CHAT_PROFILE_KEY = "clawpal_chat_profile";

export function Settings() {
  const [profiles, setProfiles] = useState<ModelProfile[]>([]);
  const [catalog, setCatalog] = useState<ModelCatalogProvider[]>([]);
  const [apiKeys, setApiKeys] = useState<ResolvedApiKey[]>([]);
  const [form, setForm] = useState<ProfileForm>(emptyForm());
  const [message, setMessage] = useState("");
  const [chatProfileId, setChatProfileId] = useState(
    () => localStorage.getItem(CHAT_PROFILE_KEY) || "",
  );

  const [catalogRefreshed, setCatalogRefreshed] = useState(false);

  // Load profiles and API keys immediately (fast)
  const refreshProfiles = () => {
    api.listModelProfiles().then(setProfiles).catch(() => {});
    api.resolveApiKeys().then(setApiKeys).catch(() => {});
  };

  useEffect(refreshProfiles, []);

  // Load catalog from cache instantly (no CLI calls)
  useEffect(() => {
    api.getCachedModelCatalog().then(setCatalog).catch(() => {});
  }, []);

  // Refresh catalog from CLI when user focuses provider/model input
  const ensureCatalog = () => {
    if (catalogRefreshed) return;
    setCatalogRefreshed(true);
    api.refreshModelCatalog().then(setCatalog).catch(() => {});
  };

  const maskedKeyMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of apiKeys) {
      map.set(entry.profileId, entry.maskedKey);
    }
    return map;
  }, [apiKeys]);

  const modelCandidates = useMemo(() => {
    const found = catalog.find((c) => c.provider === form.provider);
    return found?.models || [];
  }, [catalog, form.provider]);

  const upsert = (event: FormEvent) => {
    event.preventDefault();
    if (!form.provider || !form.model) {
      setMessage("Provider and Model are required");
      return;
    }
    if (!form.apiKey && !form.id) {
      setMessage("API Key is required");
      return;
    }
    const profileData: ModelProfile = {
      id: form.id || "",
      name: `${form.provider}/${form.model}`,
      provider: form.provider,
      model: form.model,
      authRef: "",
      apiKey: form.apiKey || undefined,
      baseUrl: form.useCustomUrl && form.baseUrl ? form.baseUrl : undefined,
      enabled: form.enabled,
    };
    api
      .upsertModelProfile(profileData)
      .then(() => {
        setMessage("Profile saved");
        setForm(emptyForm());
        refreshProfiles();
      })
      .catch(() => setMessage("Save failed"));
  };

  const editProfile = (profile: ModelProfile) => {
    setForm({
      id: profile.id,
      provider: profile.provider,
      model: profile.model,
      apiKey: "",
      useCustomUrl: !!profile.baseUrl,
      baseUrl: profile.baseUrl || "",
      enabled: profile.enabled,
    });
  };

  const deleteProfile = (id: string) => {
    api
      .deleteModelProfile(id)
      .then(() => {
        setMessage("Profile deleted");
        if (form.id === id) {
          setForm(emptyForm());
        }
        if (chatProfileId === id) {
          setChatProfileId("");
          localStorage.removeItem(CHAT_PROFILE_KEY);
        }
        refreshProfiles();
      })
      .catch(() => setMessage("Delete failed"));
  };

  const handleChatProfileChange = (value: string) => {
    setChatProfileId(value);
    if (value) {
      localStorage.setItem(CHAT_PROFILE_KEY, value);
    } else {
      localStorage.removeItem(CHAT_PROFILE_KEY);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-bold text-text-main mb-4">Settings</h2>

      {/* ---- Model Profiles ---- */}
      <div className="grid grid-cols-2 gap-3 items-start">
        {/* Create / Edit form */}
        <Card className="bg-panel border-border-subtle">
          <CardHeader>
            <CardTitle>{form.id ? "Edit Profile" : "Add Profile"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={upsert} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Provider</Label>
                <Input
                  placeholder="e.g. openai"
                  value={form.provider}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, provider: e.target.value, model: "" }))
                  }
                  onFocus={ensureCatalog}
                  list="settings-provider-list"
                  className="bg-panel border-border-subtle text-text-main"
                />
                <datalist id="settings-provider-list">
                  {catalog.map((c) => (
                    <option key={c.provider} value={c.provider} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input
                  placeholder="e.g. gpt-4o"
                  value={form.model}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, model: e.target.value }))
                  }
                  onFocus={ensureCatalog}
                  list="settings-model-list"
                  className="bg-panel border-border-subtle text-text-main"
                />
                <datalist id="settings-model-list">
                  {modelCandidates.map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      label={m.name || m.id}
                    />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder={form.id ? "(unchanged if empty)" : "sk-..."}
                  value={form.apiKey}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, apiKey: e.target.value }))
                  }
                  className="bg-panel border-border-subtle text-text-main"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="custom-url"
                  checked={form.useCustomUrl}
                  onCheckedChange={(checked) =>
                    setForm((p) => ({ ...p, useCustomUrl: checked === true }))
                  }
                />
                <Label htmlFor="custom-url">Custom Base URL</Label>
              </div>

              {form.useCustomUrl && (
                <div className="space-y-1.5">
                  <Label>Base URL</Label>
                  <Input
                    placeholder="e.g. https://api.openai.com/v1"
                    value={form.baseUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, baseUrl: e.target.value }))
                    }
                    className="bg-panel border-border-subtle text-text-main"
                  />
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <Button type="submit">Save</Button>
                {form.id && (
                  <>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deleteProfile(form.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setForm(emptyForm())}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Profiles list */}
        <Card className="bg-panel border-border-subtle">
          <CardHeader>
            <CardTitle>Model Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 && (
              <p className="text-text-main/60">No model profiles yet.</p>
            )}
            <div className="grid gap-2">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="border border-btn-border p-2.5 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <strong>{profile.provider}/{profile.model}</strong>
                    {profile.enabled ? (
                      <Badge className="bg-accent-blue/15 text-accent-blue border-0">
                        enabled
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive-red/15 text-destructive-red border-0">
                        disabled
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-text-main/70 mt-1">
                    API Key: {maskedKeyMap.get(profile.id) || "..."}
                  </div>
                  {profile.baseUrl && (
                    <div className="text-sm text-text-main/70 mt-0.5">
                      URL: {profile.baseUrl}
                    </div>
                  )}
                  <div className="flex gap-1.5 mt-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => editProfile(profile)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      type="button"
                      onClick={() => deleteProfile(profile.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---- Chat Model ---- */}
      <Card className="bg-panel border-border-subtle mt-4">
        <CardHeader>
          <CardTitle>Chat Model</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-main/75 mt-1 mb-2">
            Select which model profile to use for the Chat feature.
          </p>
          <Select
            value={chatProfileId || "__none__"}
            onValueChange={(v) =>
              handleChatProfileChange(v === "__none__" ? "" : v)
            }
          >
            <SelectTrigger className="w-[260px] bg-panel border-border-subtle text-text-main">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-panel border-border-subtle">
              <SelectItem value="__none__" className="text-text-main">
                (none selected)
              </SelectItem>
              {profiles
                .filter((p) => p.enabled)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-text-main">
                    {p.provider}/{p.model}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {message && (
        <p className="text-sm text-text-main/70 mt-3">{message}</p>
      )}
    </section>
  );
}
